'use client'

import { useEffect, useState } from 'react'
import { fetchSearchableDepartments } from '@/lib/searchable-courses'

export function useSearchableDepartments() {
	const [departments, setDepartments] = useState<string[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		setError(null)
		fetchSearchableDepartments()
			.then((rows) => {
				if (cancelled) return
				setDepartments(rows)
				setIsLoading(false)
			})
			.catch((err) => {
				if (cancelled) return
				setError(err as Error)
				setDepartments([])
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	return { departments, error, isLoading }
}
