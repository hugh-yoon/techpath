import { getCachedActiveTermIds } from '@/lib/active-term-cache'
import { supabase } from '@/lib/supabaseClient'
import {
	fetchSearchableCourseIds,
	type CourseSearchFilters,
} from '@/lib/searchable-courses'
import type { Course, SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

const SECTION_EMBED = `
	id,
	course_id,
	instructor_id,
	section_code,
	day_pattern,
	start_time,
	end_time,
	location,
	crn,
	term_id,
	is_active,
	instructor:instructors(id,name,department,rating,teaching_style,rmp_quality,rmp_professor_id,rmp_rating_count)
`

function mapSection(row: Record<string, unknown>): SectionWithRelations {
	const dayPattern = row.day_pattern as string[] | string | null
	return {
		id: row.id as string,
		course_id: row.course_id as string,
		instructor_id: row.instructor_id as string,
		section_code: row.section_code as string,
		day_pattern: parseDayPattern(dayPattern),
		start_time: normalizeTime(row.start_time as string),
		end_time: normalizeTime(row.end_time as string),
		location: (row.location as string) ?? null,
		crn: row.crn as string,
		term_id: (row.term_id as string) ?? null,
		is_active: row.is_active as boolean | undefined,
		course: undefined,
		instructor: row.instructor
			? {
					id: (row.instructor as Record<string, unknown>).id as string,
					name: (row.instructor as Record<string, unknown>).name as string,
					department: (row.instructor as Record<string, unknown>).department as string,
					rating: (row.instructor as Record<string, unknown>).rating as number | null,
					teaching_style: (row.instructor as Record<string, unknown>).teaching_style as string | null,
					rmp_quality: (row.instructor as Record<string, unknown>).rmp_quality as number | null,
					rmp_professor_id: (row.instructor as Record<string, unknown>).rmp_professor_id as string | null,
					rmp_rating_count: (row.instructor as Record<string, unknown>).rmp_rating_count as number | null,
				}
			: null,
	}
}

function sectionMatchesDisplayTerms(
	section: { is_active?: boolean | null; term_id?: string | null },
	activeTermIds: string[],
): boolean {
	if (section.is_active === false) return false
	if (!section.term_id) return false
	if (activeTermIds.length === 0) return true
	return activeTermIds.includes(section.term_id)
}

export interface CourseSearchResult {
	courses: Array<Course & { sections?: SectionWithRelations[] }>
	totalCount: number
}

export async function fetchCourseSearchPage(
	filters: CourseSearchFilters,
	limit: number,
	offset: number,
): Promise<CourseSearchResult> {
	const activeTermIds = await getCachedActiveTermIds()
	const searchableIds = await fetchSearchableCourseIds(filters, activeTermIds)
	const pageIds = searchableIds.slice(offset, offset + limit)

	if (pageIds.length === 0) {
		return { courses: [], totalCount: searchableIds.length }
	}

	const { data: rows, error } = await supabase
		.from('courses')
		.select(`*, sections(${SECTION_EMBED})`)
		.in('id', pageIds)
		.order('department')
		.order('course_number')

	if (error) throw error

	const courses = (rows ?? [])
		.map((row) => {
			const sectionsRaw = row.sections as Record<string, unknown>[] | null
			const sections = (sectionsRaw ?? [])
				.map((s) => {
					const inv = s.instructor as
						| Record<string, unknown>
						| Record<string, unknown>[]
						| null
					const instructorObj = Array.isArray(inv) ? inv[0] : inv
					return mapSection({ ...s, instructor: instructorObj ?? undefined })
				})
				.filter((s) => sectionMatchesDisplayTerms(s, activeTermIds))
			return { ...(row as unknown as Course), sections }
		})
		.filter((course) => (course.sections?.length ?? 0) > 0)

	return { courses, totalCount: searchableIds.length }
}
