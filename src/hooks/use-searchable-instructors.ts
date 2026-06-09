'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { fetchSearchableInstructors } from '@/lib/searchable-courses'

export function useSearchableInstructors() {
	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.searchableInstructors,
		queryFn: fetchSearchableInstructors,
	})

	return {
		instructors: data ?? [],
		error: error as Error | null,
		isLoading,
	}
}
