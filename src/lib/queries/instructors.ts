import { supabase } from '@/lib/supabaseClient'
import { fetchAllPaginated } from '@/lib/supabase/fetch-paginated'
import type { Instructor } from '@/types'

export async function fetchAllInstructors(): Promise<Instructor[]> {
	return fetchAllPaginated<Instructor>(() =>
		supabase.from('instructors').select('*').order('name'),
	)
}

export async function fetchInstructorById(id: string): Promise<Instructor> {
	const { data, error } = await supabase
		.from('instructors')
		.select('*')
		.eq('id', id)
		.single()
	if (error) throw error
	return data as Instructor
}
