import type { Semester } from '@/types'

export interface TermPick {
	id: string
	semester: Semester
	year: number
}

/** Mirrors Banner sync term selection: current Fall + next Spring when available. */
export function selectActiveTerms(
	terms: TermPick[],
	maxTerms = 2,
): TermPick[] {
	const year = new Date().getFullYear()
	const eligible = terms.filter(
		(t) => t.year >= year && t.year <= year + 1 && t.semester !== 'Summer',
	)

	const picked: TermPick[] = []
	const fallCurrent = eligible.find(
		(t) => t.semester === 'Fall' && t.year === year,
	)
	const springNext = eligible.find(
		(t) => t.semester === 'Spring' && t.year === year + 1,
	)
	const springCurrent = eligible.find(
		(t) => t.semester === 'Spring' && t.year === year,
	)
	const fallNext = eligible.find(
		(t) => t.semester === 'Fall' && t.year === year + 1,
	)

	if (fallCurrent) picked.push(fallCurrent)
	if (springNext && picked.length < maxTerms) picked.push(springNext)
	else if (fallNext && picked.length < maxTerms) picked.push(fallNext)
	else if (springCurrent && picked.length < maxTerms) picked.push(springCurrent)

	if (picked.length < maxTerms) {
		for (const t of eligible) {
			if (picked.some((p) => p.id === t.id)) continue
			picked.push(t)
			if (picked.length >= maxTerms) break
		}
	}

	return picked.slice(0, maxTerms)
}
