'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ReviewSource } from '@/types'

const PAGE_SIZE = 25

export interface AdminCourseReviewRow {
	id: string
	course_id: string
	rating: number
	difficulty: number
	comment: string | null
	course?: { department: string; course_number: number } | null
}

export interface AdminInstructorReviewRow {
	id: string
	instructor_id: string
	rating: number
	comment: string | null
	source?: ReviewSource
	course_context?: string | null
	instructor?: { name: string } | null
}

interface UseAdminCourseReviewsOptions {
	page: number
	search: string
}

export function useAdminCourseReviews({
	page,
	search,
}: UseAdminCourseReviewsOptions) {
	const [data, setData] = useState<AdminCourseReviewRow[]>([])
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
			.from('course_reviews')
			.select(
				'id, course_id, rating, difficulty, comment, course:courses(department, course_number)',
				{ count: 'exact' },
			)
			.order('id', { ascending: false })

		if (needle) {
			query = query.ilike('comment', `%${needle}%`)
		}

		const { data: rows, error: e, count } = await query.range(from, to)
		if (e) {
			setError(e as Error)
			setData([])
			setTotalCount(0)
		} else {
			setData(
				(rows ?? []).map((r) => {
					const row = r as Record<string, unknown>
					return {
						id: row.id as string,
						course_id: row.course_id as string,
						rating: row.rating as number,
						difficulty: row.difficulty as number,
						comment: row.comment as string | null,
						course: Array.isArray(row.course) ? row.course[0] : row.course,
					}
				}) as AdminCourseReviewRow[],
			)
			setTotalCount(count ?? 0)
		}
		setIsLoading(false)
	}, [page, search])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, totalCount, pageSize: PAGE_SIZE, error, isLoading, refetch }
}

interface UseAdminInstructorReviewsOptions {
	page: number
	search: string
	source: ReviewSource | 'all'
	rating: string
}

export function useAdminInstructorReviews({
	page,
	search,
	source,
	rating,
}: UseAdminInstructorReviewsOptions) {
	const [data, setData] = useState<AdminInstructorReviewRow[]>([])
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
			.from('instructor_reviews')
			.select(
				'id, instructor_id, rating, comment, source, course_context, instructor:instructors(name)',
				{ count: 'exact' },
			)
			.order('scraped_at', { ascending: false, nullsFirst: false })
			.order('id', { ascending: false })

		if (source !== 'all') query = query.eq('source', source)
		if (rating !== 'all') {
			const parsed = parseInt(rating, 10)
			if (!Number.isNaN(parsed)) query = query.eq('rating', parsed)
		}
		if (needle) {
			query = query.or(
				`comment.ilike.%${needle}%,course_context.ilike.%${needle}%`,
			)
		}

		const { data: rows, error: e, count } = await query.range(from, to)
		if (e) {
			setError(e as Error)
			setData([])
			setTotalCount(0)
		} else {
			setData(
				(rows ?? []).map((r) => {
					const row = r as Record<string, unknown>
					return {
						id: row.id as string,
						instructor_id: row.instructor_id as string,
						rating: row.rating as number,
						comment: row.comment as string | null,
						source: row.source as ReviewSource | undefined,
						course_context: row.course_context as string | null,
						instructor: Array.isArray(row.instructor)
							? row.instructor[0]
							: row.instructor,
					}
				}) as AdminInstructorReviewRow[],
			)
			setTotalCount(count ?? 0)
		}
		setIsLoading(false)
	}, [page, search, source, rating])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, totalCount, pageSize: PAGE_SIZE, error, isLoading, refetch }
}

export { PAGE_SIZE as ADMIN_REVIEWS_PAGE_SIZE }
