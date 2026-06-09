import { supabase } from '@/lib/supabaseClient'
import { selectActiveTerms } from '@/utils/active-terms'

export async function fetchActiveTermIds(): Promise<string[]> {
	const { data, error } = await supabase
		.from('terms')
		.select('id, semester, year')
	if (error) throw error
	return selectActiveTerms(data ?? []).map((t) => t.id)
}
