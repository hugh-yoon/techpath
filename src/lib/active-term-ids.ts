import { supabase } from '@/lib/supabaseClient'
import { selectActiveTerms } from '@/utils/active-terms'

export async function fetchActiveTermIds(): Promise<string[]> {
	const { data, error } = await supabase
		.from('terms')
		.select('id, semester, year')
	if (error) throw error
	return selectActiveTerms(data ?? []).map((t) => t.id)
}

/** PostgREST filter: active Banner terms only. */
export function activeSectionTermOrFilter(activeTermIds: string[]): string | null {
	if (activeTermIds.length === 0) return null
	return `term_id.in.(${activeTermIds.join(',')})`
}

export function sectionMatchesDisplayTerms(
	section: { is_active?: boolean | null; term_id?: string | null },
	activeTermIds: string[],
): boolean {
	if (section.is_active === false) return false
	if (!section.term_id) return false
	if (activeTermIds.length === 0) return true
	return activeTermIds.includes(section.term_id)
}

export function applyActiveSectionTermFilter<
	T extends {
		or: (
			filters: string,
			options?: { referencedTable?: string },
		) => T
	},
>(query: T, activeTermIds: string[], referencedTable?: string): T {
	const termOr = activeSectionTermOrFilter(activeTermIds)
	if (!termOr) return query
	if (referencedTable) {
		return query.or(termOr, { referencedTable })
	}
	return query.or(termOr)
}
