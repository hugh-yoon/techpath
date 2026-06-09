'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import {
	fetchAllInstructors,
	fetchInstructorById,
} from '@/lib/queries/instructors'

export function useInstructors() {
	const { data, error, isLoading, refetch } = useQuery({
		queryKey: queryKeys.instructors,
		queryFn: fetchAllInstructors,
	})

	return {
		data: data ?? [],
		error: error as Error | null,
		isLoading,
		refetch,
	}
}

export function useInstructor(id: string | null) {
	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.instructor(id ?? ''),
		queryFn: () => fetchInstructorById(id as string),
		enabled: Boolean(id),
	})

	return {
		data: data ?? null,
		error: error as Error | null,
		isLoading,
	}
}
