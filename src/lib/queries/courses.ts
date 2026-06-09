import { supabase } from '@/lib/supabaseClient'
import { fetchAllPaginated } from '@/lib/supabase/fetch-paginated'
import type { Course } from '@/types'

const COURSE_SELECT = `
	*,
	course_red_flags (
		id,
		body,
		sort_order
	)
`

export async function fetchAllCourses(): Promise<Course[]> {
	return fetchAllPaginated<Course>(() =>
		supabase
			.from('courses')
			.select(COURSE_SELECT)
			.order('department')
			.order('course_number'),
	)
}

export async function fetchCourseById(id: string): Promise<Course> {
	const { data, error } = await supabase
		.from('courses')
		.select(COURSE_SELECT)
		.eq('id', id)
		.single()
	if (error) throw error
	return data as Course
}
