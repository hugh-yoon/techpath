'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { fetchAllCourses, fetchCourseById } from '@/lib/queries/courses'
import { fetchCourseSearchPage } from '@/lib/queries/course-search'
import type { CourseSearchFilters } from '@/lib/searchable-courses'
import type { Course } from '@/types'

export type { CourseSearchFilters } from '@/lib/searchable-courses'

interface CourseWithSections extends Course {
	sections?: import('@/types').SectionWithRelations[]
}

export function useCourses() {
	const { data, error, isLoading, refetch } = useQuery({
		queryKey: queryKeys.courses,
		queryFn: fetchAllCourses,
	})

	return {
		data: data ?? [],
		error: error as Error | null,
		isLoading,
		refetch,
	}
}

export function useCourse(id: string | null) {
	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.course(id ?? ''),
		queryFn: () => fetchCourseById(id as string),
		enabled: Boolean(id),
	})

	return {
		data: data ?? null,
		error: error as Error | null,
		isLoading,
	}
}

export function useCourseSearch(
	filters: CourseSearchFilters,
	options?: { limit?: number; offset?: number },
) {
	const limit = options?.limit ?? 50
	const offset = options?.offset ?? 0
	const filterKey = {
		department: filters.department,
		course_number: filters.course_number,
		course_name: filters.course_name,
		instructor_id: filters.instructor_id,
	}

	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.courseSearch(filterKey, limit, offset),
		queryFn: () => fetchCourseSearchPage(filters, limit, offset),
	})

	return {
		data: (data?.courses ?? []) as CourseWithSections[],
		totalCount: data?.totalCount ?? 0,
		error: error as Error | null,
		isLoading,
	}
}
