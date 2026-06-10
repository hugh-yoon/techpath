export interface NavNode {
	id: string
	label: string
	href: string
	children?: NavNode[]
}

export interface OpenTab {
	id: string
	label: string
	href: string
}

/** Static navigation registry — labels and ids for tabs and breadcrumbs. */
export const APP_NAV_TREE: NavNode[] = [
	{ id: 'home', label: 'Home', href: '/' },
	{ id: 'discovery', label: 'Discovery Deck', href: '/discovery' },
	{ id: 'dashboard', label: 'Course Search', href: '/dashboard' },
	{ id: 'schedule', label: 'Schedule Builder', href: '/schedule' },
	{ id: 'path-builder', label: 'Path Builder', href: '/path-builder' },
	{ id: 'career', label: 'Career Planner', href: '/career' },
	{
		id: 'admin',
		label: 'Admin',
		href: '/admin',
		children: [
			{ id: 'admin-courses', label: 'Courses', href: '/admin/courses' },
			{ id: 'admin-instructors', label: 'Instructors', href: '/admin/instructors' },
			{ id: 'admin-sections', label: 'Sections', href: '/admin/sections' },
			{
				id: 'admin-prerequisites',
				label: 'Prerequisites',
				href: '/admin/prerequisites',
			},
			{ id: 'admin-reviews', label: 'Reviews', href: '/admin/reviews' },
			{ id: 'admin-rmp-matches', label: 'RMP Matches', href: '/admin/rmp-matches' },
			{ id: 'admin-sync-jobs', label: 'Sync Jobs', href: '/admin/sync-jobs' },
		],
	},
]

function flattenNav(nodes: NavNode[]): NavNode[] {
	const flat: NavNode[] = []
	for (const node of nodes) {
		flat.push(node)
		if (node.children?.length) {
			flat.push(...flattenNav(node.children))
		}
	}
	return flat
}

const FLAT_NAV = flattenNav(APP_NAV_TREE)

/** Pathname only — query strings are not part of tab identity. */
export function normalizeTabPath(href: string): string {
	const path = href.split('?')[0]?.split('#')[0]?.trim() ?? '/'
	if (!path.startsWith('/')) return `/${path}`
	return path.length > 1 && path.endsWith('/')
		? path.slice(0, -1)
		: path || '/'
}

function labelFromPath(path: string): string {
	const segment = path.split('/').filter(Boolean).pop()
	if (!segment) return 'Page'
	return segment
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Resolve tab metadata from the nav registry or route patterns. */
export function createTab(href: string): OpenTab {
	const path = normalizeTabPath(href)
	const node = FLAT_NAV.find((entry) => entry.href === path)

	if (node) {
		return { id: node.id, label: node.label, href: path }
	}

	if (path.startsWith('/course/')) {
		return { id: path, label: 'Course', href: path }
	}

	if (path.startsWith('/instructor/')) {
		return { id: path, label: 'Instructor', href: path }
	}

	return {
		id: path,
		label: labelFromPath(path),
		href: path,
	}
}

export function reconcileStoredTabs(hrefs: string[]): OpenTab[] {
	const seen = new Set<string>()
	const tabs: OpenTab[] = []

	for (const raw of hrefs) {
		const tab = createTab(raw)
		if (seen.has(tab.href)) continue
		seen.add(tab.href)
		tabs.push(tab)
	}

	return tabs
}

/** Replace the active tab's destination (normal in-page navigation). */
export function replaceActiveTab(
	tabs: OpenTab[],
	activeTabId: string,
	pathname: string,
): { tabs: OpenTab[]; activeTabId: string } {
	const index = tabs.findIndex((tab) => tab.id === activeTabId)
	if (index === -1) {
		const tab = createTab(pathname)
		return { tabs: [...tabs, tab], activeTabId: tab.id }
	}

	const path = normalizeTabPath(pathname)
	const current = tabs[index]
	if (current.href === path) {
		return { tabs, activeTabId }
	}

	const meta = createTab(path)
	const next = [...tabs]
	next[index] = {
		id: meta.id,
		label: meta.label,
		href: meta.href,
	}
	return { tabs: next, activeTabId: meta.id }
}

/** @deprecated Use replaceActiveTab for in-page navigation. Kept for home-tab creation. */
export function mergeTabsForPath(tabs: OpenTab[], pathname: string): OpenTab[] {
	const path = normalizeTabPath(pathname)
	if (tabs.some((tab) => tab.href === path)) return tabs
	return [...tabs, createTab(path)]
}

export function isTabBarRoute(pathname: string): boolean {
	const path = normalizeTabPath(pathname)
	return !path.startsWith('/admin')
}
