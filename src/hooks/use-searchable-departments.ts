'use client'

import { useQuery } from '@tanstack/react-query'
import { getCachedActiveTermIds } from '@/lib/active-term-cache'
import { queryKeys } from '@/lib/query-client'
import { fetchSearchableDepartments } from '@/lib/searchable-courses'

export function useActiveTermIds() {
	return useQuery({
		queryKey: queryKeys.activeTermIds,
		queryFn: getCachedActiveTermIds,
		staleTime: 5 * 60 * 1000,
	})
}

export function useSearchableDepartments() {
	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.searchableDepartments,
		queryFn: fetchSearchableDepartments,
	})

	return {
		departments: data ?? [],
		error: error as Error | null,
		isLoading,
	}
}
