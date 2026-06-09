'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
	fetchActiveTermIds,
	sectionMatchesDisplayTerms,
} from '@/lib/active-term-ids'
import { fetchSearchableCourseIds } from '@/lib/searchable-courses'
import type { CourseSearchFilters } from '@/lib/searchable-courses'
import type { Course, SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

export type { CourseSearchFilters } from '@/lib/searchable-courses'

interface CourseWithSections extends Course {
	sections?: SectionWithRelations[]
}

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
				}
			: null,
	}
}

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
	instructor:instructors(id,name,department,rating,teaching_style)
`

function mapCourseRows(
	rows: Record<string, unknown>[],
	activeTermIds: string[],
): CourseWithSections[] {
	return rows
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
}

export function useCourses() {
	const [data, setData] = useState<Course[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('courses')
			.select(
				`
				*,
				course_red_flags (
					id,
					body,
					sort_order
				)
			`,
			)
			.order('department')
			.order('course_number')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []) as Course[])
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}

export function useCourse(id: string | null) {
	const [data, setData] = useState<Course | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!id) {
			setData(null)
			setIsLoading(false)
			return
		}
		let cancelled = false
		setIsLoading(true)
		setError(null)
		supabase
			.from('courses')
			.select(
				`
				*,
				course_red_flags (
					id,
					body,
					sort_order
				)
			`,
			)
			.eq('id', id)
			.single()
			.then(({ data: row, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData(null)
				} else {
					setData(row as Course)
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [id])

	return { data, error, isLoading }
}

export function useCourseSearch(
	filters: CourseSearchFilters,
	options?: { limit?: number; offset?: number },
) {
	const [data, setData] = useState<CourseWithSections[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const limit = options?.limit ?? 50
	const offset = options?.offset ?? 0

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		setError(null)
		const run = async () => {
			let activeTermIds: string[] = []
			try {
				activeTermIds = await fetchActiveTermIds()
			} catch {
				if (!cancelled) {
					setError(new Error('Failed to load active terms'))
					setData([])
					setTotalCount(0)
					setIsLoading(false)
				}
				return
			}

			let searchableIds: string[] = []
			try {
				searchableIds = await fetchSearchableCourseIds(
					filters,
					activeTermIds,
				)
			} catch (e) {
				if (!cancelled) {
					setError(e as Error)
					setData([])
					setTotalCount(0)
					setIsLoading(false)
				}
				return
			}

			if (!cancelled) setTotalCount(searchableIds.length)

			const pageIds = searchableIds.slice(offset, offset + limit)
			if (pageIds.length === 0) {
				if (!cancelled) {
					setData([])
					setIsLoading(false)
				}
				return
			}

			const { data: rows, error: e } = await supabase
				.from('courses')
				.select(`*, sections(${SECTION_EMBED})`)
				.in('id', pageIds)
				.order('department')
				.order('course_number')

			if (cancelled) return
			if (e) {
				setError(e as Error)
				setData([])
			} else {
				setData(mapCourseRows(rows ?? [], activeTermIds))
			}
			setIsLoading(false)
		}
		run()
		return () => {
			cancelled = true
		}
	}, [
		filters.department,
		filters.course_number,
		filters.course_name,
		filters.instructor_id,
		offset,
		limit,
	])

	return { data, error, isLoading, totalCount }
}
