'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/auth-provider'
import { fetchSectionsByIds } from '@/lib/fetch-sections'
import {
	buildGuestCareerWithSchedules,
	buildGuestScheduleWithSections,
	getGuestCareerSchedules,
	getGuestSchedule,
	listGuestCareers,
	subscribeGuestPlanChanges,
} from '@/lib/guest-plan-storage'
import type { Career, CareerWithSchedules, ScheduleWithSections } from '@/types'

const fetchCareerFromDb = async (id: string) => {
	const { data: row, error: e } = await supabase
		.from('careers')
		.select(
			`
			*,
			career_schedules(
				id,
				schedule_id,
				semester_order,
				schedule:schedules(
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
				)
			)
		`,
		)
		.eq('id', id)
		.single()
	if (e) return { data: null, error: e }
	const r = row as Record<string, unknown>
	const csList = (r.career_schedules as Record<string, unknown>[] | null) ?? []
	const career_schedules = csList
		.sort((a, b) => (a.semester_order as number) - (b.semester_order as number))
		.map((cs) => {
			const s = cs.schedule as Record<string, unknown> | null
			const ssList = (s?.schedule_sections as Record<string, unknown>[] | null) ?? []
			const schedule_sections = ssList.map((ss) => ({
				id: ss.id,
				section_id: ss.section_id,
				section: (ss as Record<string, unknown>).section,
			}))
			return {
				id: cs.id,
				schedule_id: cs.schedule_id,
				semester_order: cs.semester_order,
				schedule: s ? { ...s, schedule_sections } : null,
			}
		})
	return { data: { ...r, career_schedules } as CareerWithSchedules, error: null }
}

async function fetchGuestCareer(id: string): Promise<CareerWithSchedules | null> {
	const career = listGuestCareers().find((row) => row.id === id)
	if (!career) return null

	const careerSchedules = getGuestCareerSchedules(id)
	const scheduleMap = new Map<string, ScheduleWithSections>()

	for (const cs of careerSchedules) {
		const guestSchedule = getGuestSchedule(cs.schedule_id)
		if (!guestSchedule) continue
		const sectionIds = guestSchedule.sections.map((row) => row.section_id)
		const sectionMap = await fetchSectionsByIds(sectionIds)
		scheduleMap.set(
			cs.schedule_id,
			buildGuestScheduleWithSections(guestSchedule, sectionMap),
		)
	}

	return buildGuestCareerWithSchedules(career, careerSchedules, scheduleMap)
}

export function useCareers() {
	const { user, isLoading: authLoading } = useAuth()
	const [data, setData] = useState<Career[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		if (!user) {
			setData(listGuestCareers())
			setIsLoading(false)
			return
		}

		const { data: rows, error: e } = await supabase
			.from('careers')
			.select('*')
			.order('name')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []) as Career[])
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

export function useCareer(id: string | null) {
	const { user, isLoading: authLoading } = useAuth()
	const [data, setData] = useState<CareerWithSchedules | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		if (!id) return
		setIsLoading(true)

		if (!user) {
			const guestCareer = await fetchGuestCareer(id)
			setData(guestCareer)
			setError(guestCareer ? null : new Error('Career not found'))
			setIsLoading(false)
			return
		}

		const result = await fetchCareerFromDb(id)
		setData(result.data)
		setError(result.error as Error | null)
		setIsLoading(false)
	}, [id, user])

	useEffect(() => {
		if (!id) {
			setData(null)
			setIsLoading(false)
			return
		}
		if (authLoading) return

		let cancelled = false
		setIsLoading(true)
		setError(null)

		const load = async () => {
			if (!user) {
				const guestCareer = await fetchGuestCareer(id)
				if (cancelled) return
				setData(guestCareer)
				setError(guestCareer ? null : new Error('Career not found'))
				setIsLoading(false)
				return
			}

			const result = await fetchCareerFromDb(id)
			if (cancelled) return
			setData(result.data)
			setError(result.error as Error | null)
			setIsLoading(false)
		}

		void load()
		return () => {
			cancelled = true
		}
	}, [id, user, authLoading])

	useEffect(() => {
		if (user || !id) return
		return subscribeGuestPlanChanges(() => {
			refetch()
		})
	}, [user, id, refetch])

	return {
		data,
		error,
		isLoading: isLoading || authLoading,
		refetch,
	}
}
