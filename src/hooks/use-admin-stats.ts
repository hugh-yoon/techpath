'use client'

import { useCallback, useEffect, useState } from 'react'
import {
	fetchAdminDashboardStats,
	type AdminDashboardStats,
} from '@/lib/admin-stats'

export function useAdminStats() {
	const [stats, setStats] = useState<AdminDashboardStats | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refetch = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const next = await fetchAdminDashboardStats()
			setStats(next)
		} catch (err) {
			setError(err as Error)
			setStats(null)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		refetch()
	}, [refetch])

	return { stats, error, isLoading, refetch }
}
