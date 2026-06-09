import type { RmpProfessorSummary, RmpReviewRow } from './types.ts'

/** Georgia Institute of Technology on Rate My Professors */
export const RMP_SCHOOL_ID = '361'

const RMP_SEARCH_URL = 'https://www.ratemyprofessors.com/search/professors'

/**
 * RMP is a React SPA; production sync will likely need their GraphQL API.
 * This client defines the contract and implements search via HTML fallback.
 */
export async function searchRmpProfessors(
	query: string,
): Promise<RmpProfessorSummary[]> {
	const url = new URL(RMP_SEARCH_URL)
	url.pathname = `${url.pathname}/${RMP_SCHOOL_ID}`
	url.searchParams.set('q', query)

	const res = await fetch(url.toString(), {
		headers: {
			Accept: 'text/html',
			'User-Agent': 'TechPath-Ingest/1.0',
		},
	})
	if (!res.ok) {
		throw new Error(`RMP search failed: ${res.status}`)
	}
	const html = await res.text()
	return parseRmpSearchHtml(html)
}

export async function fetchRmpProfessorReviews(
	_rmpProfessorId: string,
): Promise<RmpReviewRow[]> {
	// TODO: implement profile page / GraphQL fetch once endpoint is confirmed
	return []
}

function parseRmpSearchHtml(html: string): RmpProfessorSummary[] {
	const results: RmpProfessorSummary[] = []
	const cardPattern =
		/QUALITY([\d.]+)(\d+)\s*ratings([\s\S]*?)(\d+)%\s*would take again\s*([\d.]+)\s*level of difficulty/gi

	let match: RegExpExecArray | null
	while ((match = cardPattern.exec(html)) !== null) {
		const block = match[0]
		const nameMatch = block.match(
			/ratings([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
		)
		const deptMatch = block.match(
			/(Computer Science|Biology|Psychology|Electrical Engineering|Mathematics|Physics|Chemistry|Mechanical Engineering)/,
		)
		if (!nameMatch) continue
		results.push({
			rmpProfessorId: slugify(nameMatch[1]),
			name: nameMatch[1].trim(),
			department: deptMatch?.[1] ?? null,
			quality: Number(match[1]),
			ratingCount: Number(match[2]),
			wouldTakeAgain: Number(match[4]),
			difficulty: Number(match[5]),
		})
	}
	return results
}

function slugify(name: string): string {
	return name.toLowerCase().replace(/\s+/g, '-')
}
