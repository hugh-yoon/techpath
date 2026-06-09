'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Section } from '@/types'
import { parseDayPattern } from '@/utils/days'
import { normalizeTime } from '@/utils/db'

const PAGE_SIZE = 25

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
		term_id: (row.term_id as string) ?? null,
		is_active: row.is_active as boolean | undefined,
	}
}

interface UseAdminSectionsPageOptions {
	page: number
	search: string
	courseId?: string
	instructorId?: string
	activeOnly?: boolean
}

export function useAdminSectionsPage({
	page,
	search,
	courseId,
	instructorId,
	activeOnly = false,
}: UseAdminSectionsPageOptions) {
	const [data, setData] = useState<Section[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const from = page * PAGE_SIZE
		const to = from + PAGE_SIZE - 1
		const needle = search.trim()

		let query = supabase
			.from('sections')
			.select('*', { count: 'exact' })
			.order('crn')

		if (needle) {
			query = query.or(`crn.ilike.%${needle}%,section_code.ilike.%${needle}%`)
		}
		if (courseId) query = query.eq('course_id', courseId)
		if (instructorId) query = query.eq('instructor_id', instructorId)
		if (activeOnly) query = query.eq('is_active', true)

		const { data: rows, error: e, count } = await query.range(from, to)
		if (e) {
			setError(e as Error)
			setData([])
			setTotalCount(0)
		} else {
			setData((rows ?? []).map((r) => mapSectionRow(r as Record<string, unknown>)))
			setTotalCount(count ?? 0)
		}
		setIsLoading(false)
	}, [page, search, courseId, instructorId, activeOnly])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, totalCount, pageSize: PAGE_SIZE, error, isLoading, refetch }
}

export { PAGE_SIZE as ADMIN_SECTIONS_PAGE_SIZE }
