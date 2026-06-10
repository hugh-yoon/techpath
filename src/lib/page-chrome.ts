/** Shared navy header chrome used by PageHeader and matching tab bars. */
export const PAGE_HEADER_CHROME =
	'bg-gradient-to-r from-gt-navy to-gt-navy/90'

export const TAB_BAR_CHROME_NAVY =
	`${PAGE_HEADER_CHROME} border-b border-gt-navy/80`

export const TAB_BAR_CHROME_LIGHT =
	'bg-gt-white border-b border-gt-navy/10'

/** @deprecated Use getTabBarChrome() for route-aware styling. */
export const TAB_BAR_CHROME = TAB_BAR_CHROME_NAVY

export type TabBarTone = 'navy' | 'light'

const NAVY_HEADER_PREFIXES = [
	'/discovery',
	'/dashboard',
	'/path-builder',
	'/schedule',
	'/career',
	'/course/',
	'/instructor/',
]

function normalizePath(pathname: string): string {
	const path = pathname.split('?')[0]?.split('#')[0]?.trim() ?? '/'
	const normalized =
		path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
	return normalized || '/'
}

function routeHasNavyPageHeader(pathname: string): boolean {
	const path = normalizePath(pathname)
	return NAVY_HEADER_PREFIXES.some((prefix) => {
		if (prefix.endsWith('/')) {
			return path.startsWith(prefix)
		}
		return path === prefix || path.startsWith(`${prefix}/`)
	})
}

/** Tab bar matches the page header chrome, or page background when no header exists. */
export function getTabBarTone(pathname: string): TabBarTone {
	if (routeHasNavyPageHeader(pathname)) {
		return 'navy'
	}
	return 'light'
}

export function getTabBarChrome(pathname: string): string {
	return getTabBarTone(pathname) === 'navy'
		? TAB_BAR_CHROME_NAVY
		: TAB_BAR_CHROME_LIGHT
}
