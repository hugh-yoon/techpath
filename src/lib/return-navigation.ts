/** Query key for “return to parent” after visiting course/instructor detail. */
export const RETURN_FROM_QUERY = 'from'

export const isSafeReturnPath = (path: string): boolean => {
	if (!path || typeof path !== 'string') return false
	const p = path.trim()
	if (!p.startsWith('/')) return false
	if (p.startsWith('//')) return false
	if (p.includes('://')) return false
	if (p.includes('@')) return false
	return true
}

/**
 * Appends `?from=` or `&from=` so detail pages can render a contextual Back link.
 */
export const withReturnTo = (destination: string, fromPathname: string): string => {
	if (!isSafeReturnPath(fromPathname)) return destination
	const enc = encodeURIComponent(fromPathname)
	const join = destination.includes('?') ? '&' : '?'
	return `${destination}${join}${RETURN_FROM_QUERY}=${enc}`
}

interface SearchParamsLike {
	get(name: string): string | null
}

export const getReturnPathFromSearchParams = (
	params: SearchParamsLike | null,
	fallback: string,
): string => {
	const raw = params?.get(RETURN_FROM_QUERY)?.trim()
	if (!raw) return fallback
	try {
		const decoded = decodeURIComponent(raw)
		if (!isSafeReturnPath(decoded)) return fallback
		return decoded
	} catch {
		return fallback
	}
}

/** Short label for the Back button based on the resolved parent path. */
export const getReturnNavLabel = (path: string): string => {
	if (path === '/' || path === '') return 'Home'
	if (path.startsWith('/discovery')) return 'Discovery'
	if (path.startsWith('/dashboard')) return 'Course Search'
	if (path.startsWith('/schedule')) return 'Schedule'
	if (path.startsWith('/career')) return 'Career Planner'
	if (path.startsWith('/path-builder')) return 'Path Builder'
	if (path.startsWith('/admin')) return 'Admin'
	if (path.startsWith('/course/')) return 'Course'
	if (path.startsWith('/instructor/')) return 'Instructor'
	return 'Back'
}
