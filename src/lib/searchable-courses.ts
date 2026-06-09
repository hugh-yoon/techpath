import { supabase } from '@/lib/supabaseClient'
import {
	applyActiveSectionTermFilter,
} from '@/lib/active-term-ids'
import { getCachedActiveTermIds } from '@/lib/active-term-cache'
import {
	fetchScheduledInstructors,
	type ScheduledInstructorRef,
} from '@/lib/scheduled-instructors'

export interface CourseSearchFilters {
	department?: string
	course_number?: string
	course_name?: string
	instructor_id?: string
}

interface SearchableCourseRef {
	id: string
	department: string
	course_number: number
	course_name: string
}

const PAGE_SIZE = 1000

function parseEmbeddedCourse(
	raw: unknown,
): SearchableCourseRef | null {
	if (!raw) return null
	const course = (Array.isArray(raw) ? raw[0] : raw) as SearchableCourseRef
	if (!course?.id || !course.department) return null
	return course
}

function matchesCourseNameFilter(
	course: SearchableCourseRef,
	raw: string,
): boolean {
	const needle = raw.trim().toLowerCase()
	if (!needle) return true

	const name = course.course_name.toLowerCase()
	const deptNum = `${course.department} ${course.course_number}`.toLowerCase()
	const numStr = String(course.course_number)

	if (/^\d+$/.test(needle)) {
		return course.course_number === parseInt(needle, 10)
	}

	const deptNumMatch = needle.match(/^([a-z]+)\s*(\d+[a-z]?)$/i)
	if (deptNumMatch) {
		return (
			course.department.toLowerCase() === deptNumMatch[1].toLowerCase()
			&& numStr === deptNumMatch[2]
		)
	}

	return (
		name.includes(needle)
		|| deptNum.includes(needle)
		|| numStr.includes(needle)
	)
}

function courseMatchesFilters(
	course: SearchableCourseRef,
	filters: CourseSearchFilters,
): boolean {
	if (filters.department?.trim()) {
		if (course.department !== filters.department.trim()) return false
	}
	if (filters.course_number?.trim()) {
		const num = parseInt(filters.course_number.trim(), 10)
		if (Number.isNaN(num) || course.course_number !== num) return false
	}
	if (filters.course_name?.trim()) {
		if (!matchesCourseNameFilter(course, filters.course_name)) return false
	}
	return true
}

async function fetchActiveSectionCourseRows(
	activeTermIds: string[],
	instructorId?: string,
): Promise<Array<{ course: unknown }>> {
	const rows: Array<{ course: unknown }> = []
	let from = 0

	while (true) {
		let query = supabase
			.from('sections')
			.select(
				'course_id, course:courses(id, department, course_number, course_name)',
			)
			.eq('is_active', true)
			.range(from, from + PAGE_SIZE - 1)
		query = applyActiveSectionTermFilter(query, activeTermIds)
		if (instructorId?.trim()) {
			query = query.eq('instructor_id', instructorId.trim())
		}
		const { data, error } = await query
		if (error) throw error
		if (!data?.length) break

		rows.push(...data)
		if (data.length < PAGE_SIZE) break
		from += PAGE_SIZE
	}

	return rows
}

/** Course IDs that have at least one searchable active section, sorted for pagination. */
export async function fetchSearchableCourseIds(
	filters: CourseSearchFilters,
	activeTermIds: string[],
): Promise<string[]> {
	const data = await fetchActiveSectionCourseRows(
		activeTermIds,
		filters.instructor_id,
	)

	const coursesById = new Map<string, SearchableCourseRef>()
	for (const row of data) {
		const course = parseEmbeddedCourse(row.course)
		if (!course || !courseMatchesFilters(course, filters)) continue
		coursesById.set(course.id, course)
	}

	return [...coursesById.values()]
		.sort((a, b) => {
			const byDept = a.department.localeCompare(b.department)
			if (byDept !== 0) return byDept
			return a.course_number - b.course_number
		})
		.map((course) => course.id)
}

export async function fetchSearchableDepartments(): Promise<string[]> {
	const activeTermIds = await getCachedActiveTermIds()
	const data = await fetchActiveSectionCourseRows(activeTermIds)

	const departments = new Set<string>()
	for (const row of data) {
		const course = parseEmbeddedCourse(row.course)
		if (course?.department) departments.add(course.department)
	}
	return [...departments].sort()
}

export type SearchableInstructorRef = ScheduledInstructorRef

/** Instructors assigned to at least one searchable active section. */
export async function fetchSearchableInstructors(): Promise<
	SearchableInstructorRef[]
> {
	return fetchScheduledInstructors()
}
