'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Schedule, ScheduleWithSections, SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

function mapSectionWithRelations(ssRow: Record<string, unknown>): SectionWithRelations {
	const section = (ssRow.section ?? ssRow) as Record<string, unknown>
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

export function useSchedules() {
	const [data, setData] = useState<Schedule[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('schedules')
			.select('*')
			.order('year', { ascending: false })
			.order('name')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []) as Schedule[])
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}

export function useSchedule(id: string | null) {
	const [data, setData] = useState<ScheduleWithSections | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchSchedule = useCallback(() => {
		if (!id) {
			setData(null)
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		setError(null)
		supabase
			.from('schedules')
			.select(
				`
				*,
				schedule_sections(
					id,
					section_id,
					section:sections(
						*,
						course:courses(*),
						instructor:instructors(*)
					)
				)
			`,
			)
			.eq('id', id)
			.single()
			.then(({ data: row, error: e }) => {
				if (e) {
					setError(e as Error)
					setData(null)
				} else {
					const r = row as Record<string, unknown>
					const ss = (r.schedule_sections as Record<string, unknown>[] | null) ?? []
					const schedule_sections = ss.map((ssRow) => ({
						id: ssRow.id as string,
						section_id: ssRow.section_id as string,
						section: mapSectionWithRelations(ssRow as Record<string, unknown>),
					}))
					setData({
						...r,
						schedule_sections,
					} as ScheduleWithSections)
				}
				setIsLoading(false)
			})
	}, [id])

	useEffect(() => {
		fetchSchedule()
	}, [fetchSchedule])

	return { data, error, isLoading, refetch: fetchSchedule }
}

/**
 * Fetches all schedules with their schedule_sections, sections, courses, and instructors.
 * Use for Path Builder or any view that needs multiple semesters at once.
 */
export function useAllSchedulesWithSections() {
	const [data, setData] = useState<ScheduleWithSections[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('schedules')
			.select(
				`
				*,
				schedule_sections(
					id,
					section_id,
					section:sections(
						*,
						course:courses(*),
						instructor:instructors(*)
					)
				)
			`,
			)
			.order('year', { ascending: false })
			.order('name')
		if (e) {
			setError(e as Error)
			setData([])
			setIsLoading(false)
			return
		}
		const list = (rows ?? []) as Record<string, unknown>[]
		const mapped = list.map((r) => {
			const ss = (r.schedule_sections as Record<string, unknown>[] | null) ?? []
			const schedule_sections = ss.map((ssRow) => ({
				id: ssRow.id as string,
				section_id: ssRow.section_id as string,
				section: mapSectionWithRelations(ssRow as Record<string, unknown>),
			}))
			return { ...r, schedule_sections } as ScheduleWithSections
		})
		setData(mapped)
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}
