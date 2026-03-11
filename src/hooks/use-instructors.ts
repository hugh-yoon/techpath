'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Instructor } from '@/types'

export function useInstructors() {
	const [data, setData] = useState<Instructor[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data: rows, error: e } = await supabase
			.from('instructors')
			.select('*')
			.order('name')
		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}
		setData((rows ?? []) as Instructor[])
		setIsLoading(false)
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { data, error, isLoading, refetch }
}

export function useInstructor(id: string | null) {
	const [data, setData] = useState<Instructor | null>(null)
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
			.from('instructors')
			.select('*')
			.eq('id', id)
			.single()
			.then(({ data: row, error: e }) => {
				if (cancelled) return
				if (e) {
					setError(e as Error)
					setData(null)
				} else {
					setData(row as Instructor)
				}
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [id])

	return { data, error, isLoading }
}
