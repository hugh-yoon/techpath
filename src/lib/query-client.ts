import { QueryClient } from '@tanstack/react-query'

export function createAppQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				gcTime: 5 * 60 * 1000,
				refetchOnWindowFocus: false,
				retry: 1,
			},
		},
	})
}

export const queryKeys = {
	activeTermIds: ['active-term-ids'] as const,
	courses: ['courses'] as const,
	course: (id: string) => ['course', id] as const,
	instructors: ['instructors'] as const,
	instructor: (id: string) => ['instructor', id] as const,
	courseSearch: (
		filters: Record<string, string | undefined>,
		limit: number,
		offset: number,
	) => ['course-search', filters, limit, offset] as const,
	searchableDepartments: ['searchable-departments'] as const,
	searchableInstructors: ['searchable-instructors'] as const,
}
