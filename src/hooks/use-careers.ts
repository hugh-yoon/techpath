'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Career, CareerWithSchedules } from '@/types'

export function useCareers() {
	const [data, setData] = useState<Career[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
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
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}

const fetchCareer = async (id: string) => {
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

export function useCareer(id: string | null) {
	const [data, setData] = useState<CareerWithSchedules | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		if (!id) return
		setIsLoading(true)
		const result = await fetchCareer(id)
		setData(result.data)
		setError(result.error as Error | null)
		setIsLoading(false)
	}, [id])

	useEffect(() => {
		if (!id) {
			setData(null)
			setIsLoading(false)
			return
		}
		let cancelled = false
		setIsLoading(true)
		setError(null)
		fetchCareer(id).then((result) => {
			if (cancelled) return
			setData(result.data)
			setError(result.error as Error | null)
			setIsLoading(false)
		})
		return () => {
			cancelled = true
		}
	}, [id])

	return { data, error, isLoading, refetch }
}
