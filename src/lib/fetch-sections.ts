import { supabase } from '@/lib/supabaseClient'
import type { SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

function mapSectionRow(section: Record<string, unknown>): SectionWithRelations {
	const course = (section.course as Record<string, unknown>[] | Record<string, unknown> | null) ?? null
	const instructor = (section.instructor as Record<string, unknown>[] | Record<string, unknown> | null) ?? null
	const co = Array.isArray(course) ? course[0] : course
	const inst = Array.isArray(instructor) ? instructor[0] : instructor

	return {
		id: section.id as string,
		course_id: section.course_id as string,
		instructor_id: section.instructor_id as string,
		section_code: section.section_code as string,
		day_pattern: parseDayPattern(section.day_pattern as string[] | string | null),
		start_time: normalizeTime(section.start_time as string),
		end_time: normalizeTime(section.end_time as string),
		location: (section.location as string) ?? null,
		crn: section.crn as string,
		course: co
			? {
					id: co.id as string,
					department: co.department as string,
					course_number: co.course_number as number,
					course_name: co.course_name as string,
					description: co.description as string | null,
					credit_hours: co.credit_hours as number,
					difficulty_rating: co.difficulty_rating as number | null,
				}
			: null,
		instructor: inst
			? {
					id: inst.id as string,
					name: inst.name as string,
					department: inst.department as string,
					rating: inst.rating as number | null,
					teaching_style: inst.teaching_style as string | null,
				}
			: null,
	}
}

export async function fetchSectionsByIds(
	sectionIds: string[],
): Promise<Map<string, SectionWithRelations>> {
	const map = new Map<string, SectionWithRelations>()
	if (sectionIds.length === 0) return map

	const { data, error } = await supabase
		.from('sections')
		.select(
			`
			*,
			course:courses(*),
			instructor:instructors(*)
		`,
		)
		.in('id', sectionIds)

	if (error || !data) return map

	for (const row of data as Record<string, unknown>[]) {
		const section = mapSectionRow(row)
		map.set(section.id, section)
	}

	return map
}
