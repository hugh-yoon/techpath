import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { activeSectionTermOrFilter, selectActiveTerms } from './active-terms.ts'

/** Instructor IDs on active Banner sections in display terms (not RMP-only). */
export async function fetchScheduledInstructorIds(
	supabase: SupabaseClient,
): Promise<string[]> {
	const { data: terms, error: termsError } = await supabase
		.from('terms')
		.select('id, semester, year')
	if (termsError) throw termsError

	const activeTermIds = selectActiveTerms(terms ?? []).map((term) => term.id)
	const instructorIds = new Set<string>()
	const pageSize = 1000
	let from = 0

	while (true) {
		let query = supabase
			.from('sections')
			.select('instructor_id')
			.eq('is_active', true)
			.not('instructor_id', 'is', null)
			.range(from, from + pageSize - 1)

		const termOr = activeSectionTermOrFilter(activeTermIds)
		if (termOr) query = query.or(termOr)

		const { data, error } = await query
		if (error) throw error
		if (!data?.length) break

		for (const row of data) {
			if (row.instructor_id) instructorIds.add(row.instructor_id as string)
		}

		if (data.length < pageSize) break
		from += pageSize
	}

	return [...instructorIds]
}
