'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CourseReview, InstructorReview, SectionReview } from '@/types'

export function useCourseReviews(courseId: string | null) {
	const [data, setData] = useState<CourseReview[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchReviews = useCallback(() => {
		if (!courseId) {
			setData([])
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		setError(null)
		supabase
			.from('course_reviews')
			.select('*')
			.eq('course_id', courseId)
			.order('id', { ascending: false })
			.then(({ data: rows, error: e }) => {
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					setData((rows ?? []) as CourseReview[])
				}
				setIsLoading(false)
			})
	}, [courseId])

	useEffect(() => {
		fetchReviews()
	}, [fetchReviews])

	return { data, error, isLoading, refetch: fetchReviews }
}

export function useInstructorReviews(instructorId: string | null) {
	const [data, setData] = useState<InstructorReview[]>([])
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
			.from('instructor_reviews')
			.select('*')
			.eq('instructor_id', instructorId)
			.order('id', { ascending: false })
			.then(({ data: rows, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					setData((rows ?? []) as InstructorReview[])
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [instructorId])

	return { data, error, isLoading }
}

export function useCreateCourseReview(courseId: string) {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const create = useCallback(
		async (rating: number, difficulty: number, comment: string | null) => {
			setIsLoading(true)
			setError(null)
			const { error: e } = await supabase.from('course_reviews').insert({
				course_id: courseId,
				rating,
				difficulty,
				comment: comment || null,
			})
			setIsLoading(false)
			if (e) setError(e as Error)
			return e == null
		},
		[courseId],
	)

	return { create, isLoading, error }
}

export function useSectionReviews(sectionId: string | null) {
	const [data, setData] = useState<SectionReview[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchReviews = useCallback(() => {
		if (!sectionId) {
			setData([])
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		setError(null)
		supabase
			.from('section_reviews')
			.select('*')
			.eq('section_id', sectionId)
			.order('id', { ascending: false })
			.then(({ data: rows, error: e }) => {
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					setData((rows ?? []) as SectionReview[])
				}
				setIsLoading(false)
			})
	}, [sectionId])

	useEffect(() => {
		let cancelled = false
		fetchReviews()
		return () => {
			cancelled = true
		}
	}, [fetchReviews])

	return { data, error, isLoading, refetch: fetchReviews }
}

export function useCreateSectionReview(sectionId: string) {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const create = useCallback(
		async (rating: number, difficulty: number, comment: string | null) => {
			setIsLoading(true)
			setError(null)
			const { error: e } = await supabase.from('section_reviews').insert({
				section_id: sectionId,
				rating,
				difficulty,
				comment: comment || null,
			})
			setIsLoading(false)
			if (e) setError(e as Error)
			return e == null
		},
		[sectionId],
	)

	return { create, isLoading, error }
}

export function useCreateInstructorReview(instructorId: string) {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const create = useCallback(
		async (rating: number, comment: string | null) => {
			setIsLoading(true)
			setError(null)
			const { error: e } = await supabase.from('instructor_reviews').insert({
				instructor_id: instructorId,
				rating,
				comment: comment || null,
			})
			setIsLoading(false)
			if (e) setError(e as Error)
			return e == null
		},
		[instructorId],
	)

	return { create, isLoading, error }
}

export function useDeleteCourseReview() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const remove = useCallback(async (id: string) => {
		setIsLoading(true)
		setError(null)
		const { error: e } = await supabase.from('course_reviews').delete().eq('id', id)
		setIsLoading(false)
		if (e) setError(e as Error)
		return e == null
	}, [])

	return { remove, isLoading, error }
}

export function useDeleteInstructorReview() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const remove = useCallback(async (id: string) => {
		setIsLoading(true)
		setError(null)
		const { error: e } = await supabase.from('instructor_reviews').delete().eq('id', id)
		setIsLoading(false)
		if (e) setError(e as Error)
		return e == null
	}, [])

	return { remove, isLoading, error }
}
