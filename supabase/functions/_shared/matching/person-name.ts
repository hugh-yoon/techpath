const TITLE_PREFIXES =
	/^(dr\.?|prof\.?|professor|mr\.?|mrs\.?|ms\.?|miss)\s+/i
const NAME_SUFFIXES = /\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i

export interface ParsedPersonName {
	/** Display order: first [middle] last */
	first: string
	middle: string
	last: string
	/** Lowercase "first middle last" without titles/suffixes */
	normalizedFull: string
	/** Lowercase "last first" for dedup keys */
	sortKey: string
}

export function parsePersonName(raw: string): ParsedPersonName | null {
	let name = raw.trim().replace(/\s+/g, ' ')
	if (!name || name.toUpperCase() === 'TBA') return null

	name = name.replace(TITLE_PREFIXES, '').replace(NAME_SUFFIXES, '').trim()
	if (!name) return null

	let first = ''
	let middle = ''
	let last = ''

	if (name.includes(',')) {
		const [lastPart, rest] = name.split(',').map((p) => p.trim())
		last = lastPart
		const restTokens = rest.split(/\s+/).filter(Boolean)
		first = restTokens[0] ?? ''
		middle = restTokens.slice(1).join(' ')
	} else {
		const tokens = name.split(/\s+/).filter(Boolean)
		if (tokens.length === 1) {
			last = tokens[0]
		} else if (tokens.length === 2) {
			first = tokens[0]
			last = tokens[1]
		} else {
			first = tokens[0]
			last = tokens[tokens.length - 1]
			middle = tokens.slice(1, -1).join(' ')
		}
	}

	first = normalizeNameToken(first)
	middle = normalizeNameToken(middle)
	last = normalizeNameToken(last)

	if (!last && first) {
		last = first
		first = ''
	}
	if (!last) return null

	const normalizedFull = [first, middle, last].filter(Boolean).join(' ')
	const sortKey = `${last} ${first}`.trim()

	return { first, middle, last, normalizedFull, sortKey }
}

export function normalizeNameToken(token: string): string {
	return token
		.replace(/[.']/g, '')
		.trim()
		.toLowerCase()
}

export function normalizeInstructorName(name: string): string {
	const parsed = parsePersonName(name)
	return parsed?.normalizedFull ?? name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0
	if (a.length === 0) return b.length
	if (b.length === 0) return a.length

	const matrix: number[][] = []
	for (let i = 0; i <= b.length; i++) matrix[i] = [i]
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			const cost = b[i - 1] === a[j - 1] ? 0 : 1
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			)
		}
	}
	return matrix[b.length][a.length]
}

function scoreTokenMatch(a: string, b: string): number {
	if (!a || !b) return 0
	if (a === b) return 1
	if (a.length === 1 && b.startsWith(a)) return 0.88
	if (b.length === 1 && a.startsWith(b)) return 0.88
	const dist = levenshtein(a, b)
	const maxLen = Math.max(a.length, b.length)
	if (maxLen <= 3 && dist === 1) return 0.82
	if (maxLen > 3 && dist === 1) return 0.9
	if (maxLen > 3 && dist === 2) return 0.75
	return 0
}

export interface PersonNameMatchScore {
	score: number
	lastNameScore: number
	firstNameScore: number
	reason: string
}

export function scorePersonNameMatch(
	left: string | ParsedPersonName,
	right: string | ParsedPersonName,
): PersonNameMatchScore {
	const a = typeof left === 'string' ? parsePersonName(left) : left
	const b = typeof right === 'string' ? parsePersonName(right) : right

	if (!a || !b) {
		return {
			score: 0,
			lastNameScore: 0,
			firstNameScore: 0,
			reason: 'invalid_name',
		}
	}

	if (a.normalizedFull === b.normalizedFull) {
		return {
			score: 1,
			lastNameScore: 1,
			firstNameScore: 1,
			reason: 'exact_full',
		}
	}

	const lastNameScore = scoreTokenMatch(a.last, b.last)
	const firstNameScore = a.first && b.first
		? scoreTokenMatch(a.first, b.first)
		: 0.5

	let score = lastNameScore * 0.58 + firstNameScore * 0.42

	if (lastNameScore < 0.75) {
		score = Math.min(score, 0.45)
	}

	if (lastNameScore >= 0.9 && firstNameScore >= 0.88) {
		score = Math.max(score, 0.92)
	}

	return {
		score: Math.min(score, 1),
		lastNameScore,
		firstNameScore,
		reason: 'token_match',
	}
}

/** Search queries to try against RMP, best first. */
export function buildRmpSearchQueries(name: string): string[] {
	const parsed = parsePersonName(name)
	if (!parsed) return [name.trim()].filter(Boolean)

	const queries = new Set<string>()
	if (parsed.first && parsed.last) {
		queries.add(`${parsed.first} ${parsed.last}`)
		queries.add(`${parsed.last} ${parsed.first}`)
	}
	if (parsed.last) queries.add(parsed.last)
	queries.add(name.trim())
	return [...queries]
}
