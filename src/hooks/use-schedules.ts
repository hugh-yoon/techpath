'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/auth-provider'
import { fetchSectionsByIds } from '@/lib/fetch-sections'
import {
	buildGuestScheduleWithSections,
	getGuestSchedule,
	listGuestSchedules,
	subscribeGuestPlanChanges,
} from '@/lib/guest-plan-storage'
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

async function hydrateGuestSchedule(
	id: string,
): Promise<ScheduleWithSections | null> {
	const guestSchedule = getGuestSchedule(id)
	if (!guestSchedule) return null
	const sectionIds = guestSchedule.sections.map((row) => row.section_id)
	const sectionMap = await fetchSectionsByIds(sectionIds)
	return buildGuestScheduleWithSections(guestSchedule, sectionMap)
}

async function hydrateGuestSchedules(): Promise<ScheduleWithSections[]> {
	const schedules = listGuestSchedules()
	const results: ScheduleWithSections[] = []
	for (const schedule of schedules) {
		const hydrated = await hydrateGuestSchedule(schedule.id)
		if (hydrated) results.push(hydrated)
	}
	return results
}

export function useSchedules() {
	const { user, isLoading: authLoading } = useAuth()
	const [data, setData] = useState<Schedule[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		if (!user) {
			setData(listGuestSchedules())
			setIsLoading(false)
			return
		}

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
	}, [user])

	useEffect(() => {
		if (authLoading) return
		refetch()
	}, [authLoading, refetch])

	useEffect(() => {
		if (user) return
		return subscribeGuestPlanChanges(() => {
			refetch()
		})
	}, [user, refetch])

	return { data, error, isLoading: isLoading || authLoading, refetch }
}

export function useSchedule(id: string | null) {
	const { user, isLoading: authLoading } = useAuth()
	const [data, setData] = useState<ScheduleWithSections | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchSchedule = useCallback(async () => {
		if (!id) {
			setData(null)
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		setError(null)

		if (!user) {
			const hydrated = await hydrateGuestSchedule(id)
			setData(hydrated)
			setError(hydrated ? null : new Error('Schedule not found'))
			setIsLoading(false)
			return
		}

		const { data: row, error: e } = await supabase
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
	}, [id, user])

	useEffect(() => {
		if (authLoading) return
		fetchSchedule()
	}, [authLoading, fetchSchedule])

	useEffect(() => {
		if (user || !id) return
		return subscribeGuestPlanChanges(() => {
			fetchSchedule()
		})
	}, [user, id, fetchSchedule])

	return {
		data,
		error,
		isLoading: isLoading || authLoading,
		refetch: fetchSchedule,
	}
}

export function useAllSchedulesWithSections() {
	const { user, isLoading: authLoading } = useAuth()
	const [data, setData] = useState<ScheduleWithSections[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		if (!user) {
			const hydrated = await hydrateGuestSchedules()
			setData(hydrated)
			setIsLoading(false)
			return
		}

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
	}, [user])

	useEffect(() => {
		if (authLoading) return
		refetch()
	}, [authLoading, refetch])

	useEffect(() => {
		if (user) return
		return subscribeGuestPlanChanges(() => {
			refetch()
		})
	}, [user, refetch])

	return { data, error, isLoading: isLoading || authLoading, refetch }
}
