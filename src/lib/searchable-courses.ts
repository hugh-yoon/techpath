import { supabase } from '@/lib/supabaseClient'
import {
	applyActiveSectionTermFilter,
	fetchActiveTermIds,
} from '@/lib/active-term-ids'

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

function parseEmbeddedCourse(
	raw: unknown,
): SearchableCourseRef | null {
	if (!raw) return null
	const course = (Array.isArray(raw) ? raw[0] : raw) as SearchableCourseRef
	if (!course?.id || !course.department) return null
	return course
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
		const needle = filters.course_name.trim().toLowerCase()
		if (!course.course_name.toLowerCase().includes(needle)) return false
	}
	return true
}

/** Course IDs that have at least one searchable active section, sorted for pagination. */
export async function fetchSearchableCourseIds(
	filters: CourseSearchFilters,
	activeTermIds: string[],
): Promise<string[]> {
	let query = supabase
		.from('sections')
		.select(
			'course_id, course:courses(id, department, course_number, course_name)',
		)
		.eq('is_active', true)
	query = applyActiveSectionTermFilter(query, activeTermIds)
	if (filters.instructor_id?.trim()) {
		query = query.eq('instructor_id', filters.instructor_id.trim())
	}
	const { data, error } = await query
	if (error) throw error

	const coursesById = new Map<string, SearchableCourseRef>()
	for (const row of data ?? []) {
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
	const activeTermIds = await fetchActiveTermIds()
	let query = supabase
		.from('sections')
		.select('course:courses(department)')
		.eq('is_active', true)
	query = applyActiveSectionTermFilter(query, activeTermIds)
	const { data, error } = await query
	if (error) throw error

	const departments = new Set<string>()
	for (const row of data ?? []) {
		const course = parseEmbeddedCourse(row.course)
		if (course?.department) departments.add(course.department)
	}
	return [...departments].sort()
}
