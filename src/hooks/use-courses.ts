'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Course, SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

export interface CourseSearchFilters {
	department?: string
	course_number?: string
	course_name?: string
	instructor_id?: string
}

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

export function useCourses() {
	const [data, setData] = useState<Course[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('courses')
			.select('*')
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
			.select('*')
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
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const limit = options?.limit ?? 50
	const offset = options?.offset ?? 0

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		setError(null)
		const run = async () => {
			let courseIds: string[] | null = null
			if (filters.instructor_id?.trim()) {
				const { data: sectionRows } = await supabase
					.from('sections')
					.select('course_id')
					.eq('instructor_id', filters.instructor_id.trim())
				courseIds = [...new Set((sectionRows ?? []).map((r) => r.course_id))]
				if (courseIds.length === 0) {
					if (!cancelled) {
						setData([])
						setIsLoading(false)
					}
					return
				}
			}
			let query = supabase
				.from('courses')
				.select(
					`
					*,
					sections(
						id,
						course_id,
						instructor_id,
						section_code,
						day_pattern,
						start_time,
						end_time,
						location,
						crn,
						instructor:instructors(id,name,department,rating,teaching_style)
					)
				`,
				)
				.order('department')
				.order('course_number')
				.range(offset, offset + limit - 1)
			if (filters.department?.trim()) {
				query = query.eq('department', filters.department.trim())
			}
			if (filters.course_number?.trim()) {
				const num = parseInt(filters.course_number.trim(), 10)
				if (!Number.isNaN(num)) query = query.eq('course_number', num)
			}
			if (filters.course_name?.trim()) {
				query = query.ilike('course_name', `%${filters.course_name.trim()}%`)
			}
			if (courseIds) {
				query = query.in('id', courseIds)
			}
			const { data: rows, error: e } = await query
			if (cancelled) return
			if (e) {
				setError(e as Error)
				setData([])
			} else {
				const mapped = (rows ?? []).map((row: Record<string, unknown>) => {
					const sectionsRaw = row.sections as Record<string, unknown>[] | null
					return {
						...row,
						sections: sectionsRaw?.map((s) => {
							const inv = s.instructor as Record<string, unknown> | Record<string, unknown>[] | null
							const instructorObj = Array.isArray(inv) ? inv[0] : inv
							return mapSection({ ...s, instructor: instructorObj ?? undefined })
						}),
					}
				}) as CourseWithSections[]
				setData(mapped)
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

	return { data, error, isLoading }
}
