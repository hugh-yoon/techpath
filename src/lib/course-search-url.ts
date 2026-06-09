import type { CourseSearchFilters } from '@/lib/searchable-courses'

const FILTER_KEYS = [
	'department',
	'course_number',
	'course_name',
	'instructor_id',
] as const satisfies ReadonlyArray<keyof CourseSearchFilters>

export interface DashboardSearchState extends CourseSearchFilters {}

export function parseDashboardSearchParams(
	params: URLSearchParams,
): DashboardSearchState {
	const state: DashboardSearchState = {}

	for (const key of FILTER_KEYS) {
		const value = params.get(key)?.trim()
		if (value) state[key] = value
	}

	return state
}

export function buildDashboardSearchParams(
	filters: CourseSearchFilters,
): URLSearchParams {
	const params = new URLSearchParams()

	for (const key of FILTER_KEYS) {
		const value = filters[key]?.trim()
		if (value) params.set(key, value)
	}

	return params
}

export function dashboardFiltersEqual(
	a: CourseSearchFilters,
	b: CourseSearchFilters,
): boolean {
	for (const key of FILTER_KEYS) {
		if ((a[key] ?? '') !== (b[key] ?? '')) return false
	}
	return true
}
