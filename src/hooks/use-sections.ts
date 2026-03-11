'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Section, SectionWithRelations } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

function mapSectionRow(row: Record<string, unknown>): Section {
	return {
		id: row.id as string,
		course_id: row.course_id as string,
		instructor_id: row.instructor_id as string,
		section_code: row.section_code as string,
		day_pattern: parseDayPattern(row.day_pattern as string[] | string | null),
		start_time: normalizeTime(row.start_time as string),
		end_time: normalizeTime(row.end_time as string),
		location: (row.location as string) ?? null,
		crn: row.crn as string,
	}
}

export function useSectionsByCourse(courseId: string | null) {
	const [data, setData] = useState<SectionWithRelations[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!courseId) {
			setData([])
			setIsLoading(false)
			return
		}
		let cancelled = false
		setIsLoading(true)
		setError(null)
		supabase
			.from('sections')
			.select(
				`
				*,
				course:courses(*),
				instructor:instructors(*)
			`,
			)
			.eq('course_id', courseId)
			.then(({ data: rows, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					const list = (rows ?? []).map((r: Record<string, unknown>) => {
						const co = r.course as Record<string, unknown> | Record<string, unknown>[] | null
						const inst = r.instructor as Record<string, unknown> | Record<string, unknown>[] | null
						const course = Array.isArray(co) ? co[0] : co
						const instructor = Array.isArray(inst) ? inst[0] : inst
						return {
							...mapSectionRow(r),
							course: course as SectionWithRelations['course'],
							instructor: instructor as SectionWithRelations['instructor'],
						}
					})
					setData(list)
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [courseId])

	return { data, error, isLoading }
}

export function useSections() {
	const [data, setData] = useState<Section[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('sections')
			.select('*')
			.order('crn')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []).map((r: Record<string, unknown>) => mapSectionRow(r)))
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}

export function useSectionsByInstructor(instructorId: string | null) {
	const [data, setData] = useState<SectionWithRelations[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!instructorId) {
			setData([])
			setIsLoading(false)
			return
		}
		let cancelled = false
		setIsLoading(true)
		setError(null)
		supabase
			.from('sections')
			.select(
				`
				*,
				course:courses(*),
				instructor:instructors(*)
			`,
			)
			.eq('instructor_id', instructorId)
			.then(({ data: rows, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					const list = (rows ?? []).map((r: Record<string, unknown>) => {
						const co = r.course as Record<string, unknown> | Record<string, unknown>[] | null
						const inst = r.instructor as Record<string, unknown> | Record<string, unknown>[] | null
						const course = Array.isArray(co) ? co[0] : co
						const instructor = Array.isArray(inst) ? inst[0] : inst
						return {
							...mapSectionRow(r),
							course: course as SectionWithRelations['course'],
							instructor: instructor as SectionWithRelations['instructor'],
						}
					})
					setData(list)
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [instructorId])

	return { data, error, isLoading }
}
