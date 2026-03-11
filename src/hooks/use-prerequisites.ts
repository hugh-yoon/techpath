'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CoursePrerequisite } from '@/types'

export function usePrerequisitesByCourse(courseId: string | null) {
	const [data, setData] = useState<CoursePrerequisite[]>([])
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
			.from('course_prerequisites')
			.select('*')
			.eq('course_id', courseId)
			.then(({ data: rows, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData([])
				} else {
					setData((rows ?? []) as CoursePrerequisite[])
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [courseId])

	return { data, error, isLoading }
}

export function useAllPrerequisites() {
	const [data, setData] = useState<CoursePrerequisite[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('course_prerequisites')
			.select('*')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []) as CoursePrerequisite[])
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}
