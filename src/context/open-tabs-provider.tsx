'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
	createTab,
	isTabBarRoute,
	normalizeTabPath,
	reconcileStoredTabs,
	replaceActiveTab,
	type OpenTab,
} from '@/lib/app-navigation'

const STORAGE_KEY = 'techpath-open-tabs'

type NavigationMode = 'new-tab' | 'switch-tab'

interface StoredTabs {
	hrefs: string[]
	activeTabId?: string | null
}

interface OpenTabsContextValue {
	tabs: OpenTab[]
	activeTabId: string | null
	activeHref: string
	hasHydrated: boolean
	closeTab: (id: string) => void
	reorderTabs: (activeId: string, overId: string) => void
	updateTabLabel: (href: string, label: string) => void
	openInNewTab: (href: string, tabLabel?: string) => void
	openNewHomeTab: () => void
	activateTab: (id: string) => void
}

const OpenTabsContext = createContext<OpenTabsContextValue | null>(null)

function readStoredTabs(): StoredTabs {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) return { hrefs: [] }

		const parsed = JSON.parse(raw) as StoredTabs | string[]
		if (Array.isArray(parsed)) {
			return { hrefs: parsed }
		}

		return {
			hrefs: Array.isArray(parsed.hrefs) ? parsed.hrefs : [],
			activeTabId: parsed.activeTabId ?? null,
		}
	} catch {
		return { hrefs: [] }
	}
}

function hydrateTabState(pathname: string): {
	tabs: OpenTab[]
	activeTabId: string | null
} {
	const path = normalizeTabPath(pathname)
	const stored = readStoredTabs()
	let tabs = reconcileStoredTabs(stored.hrefs)

	if (tabs.length === 0 && isTabBarRoute(path) && path !== '/') {
		const tab = createTab(path)
		return { tabs: [tab], activeTabId: tab.id }
	}

	let activeTabId =
		stored.activeTabId && tabs.some((tab) => tab.id === stored.activeTabId)
			? stored.activeTabId
			: null

	if (!activeTabId) {
		activeTabId =
			tabs.find((tab) => tab.href === path)?.id ?? tabs[0]?.id ?? null
	}

	if (activeTabId && isTabBarRoute(path)) {
		const activeTab = tabs.find((tab) => tab.id === activeTabId)
		if (activeTab && activeTab.href !== path) {
			const replaced = replaceActiveTab(tabs, activeTabId, path)
			return {
				tabs: replaced.tabs,
				activeTabId: replaced.activeTabId,
			}
		}
	}

	return { tabs, activeTabId }
}

export function OpenTabsProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() ?? '/'
	const router = useRouter()
	const [tabs, setTabs] = useState<OpenTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string | null>(null)
	const [hasHydrated, setHasHydrated] = useState(false)
	const activeTabIdRef = useRef<string | null>(null)
	const navigationModeRef = useRef<NavigationMode | null>(null)

	const activeHref = normalizeTabPath(pathname)

	const syncActiveTabId = useCallback((id: string | null) => {
		activeTabIdRef.current = id
		setActiveTabId(id)
	}, [])

	useEffect(() => {
		const initial = hydrateTabState(activeHref)
		setTabs(initial.tabs)
		syncActiveTabId(initial.activeTabId)
		setHasHydrated(true)
	}, [])

	useEffect(() => {
		if (!hasHydrated || !isTabBarRoute(activeHref)) return

		const mode = navigationModeRef.current
		navigationModeRef.current = null
		if (mode === 'new-tab' || mode === 'switch-tab') return

		const currentActiveId = activeTabIdRef.current
		if (!currentActiveId) {
			const tab = createTab(activeHref)
			setTabs((current) => (current.length === 0 ? [tab] : current))
			syncActiveTabId(tab.id)
			return
		}

		setTabs((current) => {
			const activeTab = current.find((tab) => tab.id === currentActiveId)
			if (activeTab?.href === activeHref) return current

			const replaced = replaceActiveTab(current, currentActiveId, activeHref)
			syncActiveTabId(replaced.activeTabId)
			return replaced.tabs
		})
	}, [activeHref, hasHydrated, syncActiveTabId])

	useEffect(() => {
		if (!hasHydrated) return
		try {
			const payload: StoredTabs = {
				hrefs: tabs.map((tab) => tab.href),
				activeTabId,
			}
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
		} catch {
			// sessionStorage unavailable
		}
	}, [tabs, activeTabId, hasHydrated])

	const activateTab = useCallback(
		(id: string) => {
			navigationModeRef.current = 'switch-tab'
			syncActiveTabId(id)
		},
		[syncActiveTabId],
	)

	const closeTab = useCallback(
		(id: string) => {
			const index = tabs.findIndex((tab) => tab.id === id)
			if (index === -1) return

			const next = tabs.filter((tab) => tab.id !== id)
			const isClosingActive = id === activeTabIdRef.current

			if (isClosingActive) {
				const neighbor = next[index] ?? next[index - 1]
				setTabs(next)
				syncActiveTabId(neighbor?.id ?? null)
				router.push(neighbor?.href ?? '/')
				return
			}

			setTabs(next)
		},
		[tabs, router, syncActiveTabId],
	)

	const reorderTabs = useCallback((activeId: string, overId: string) => {
		if (activeId === overId) return

		setTabs((current) => {
			const oldIndex = current.findIndex((tab) => tab.id === activeId)
			const newIndex = current.findIndex((tab) => tab.id === overId)
			if (oldIndex === -1 || newIndex === -1) return current

			const next = [...current]
			const [moved] = next.splice(oldIndex, 1)
			next.splice(newIndex, 0, moved)
			return next
		})
	}, [])

	const updateTabLabel = useCallback((href: string, label: string) => {
		const path = normalizeTabPath(href)
		const trimmed = label.trim()
		if (!trimmed) return

		setTabs((current) =>
			current.map((tab) =>
				tab.href === path ? { ...tab, label: trimmed } : tab,
			),
		)
	}, [])

	const openInNewTab = useCallback(
		(href: string, tabLabel?: string) => {
			const path = normalizeTabPath(href)
			const existing = tabs.find((entry) => entry.href === path)

			if (existing) {
				navigationModeRef.current = 'switch-tab'
				syncActiveTabId(existing.id)
				if (tabLabel?.trim()) {
					setTabs((current) =>
						current.map((entry) =>
							entry.id === existing.id
								? { ...entry, label: tabLabel.trim() }
								: entry,
						),
					)
				}
				router.push(path)
				return
			}

			const tab = createTab(path)
			if (tabLabel?.trim()) tab.label = tabLabel.trim()

			navigationModeRef.current = 'new-tab'
			syncActiveTabId(tab.id)
			setTabs((current) => [...current, tab])
			router.push(path)
		},
		[tabs, router, syncActiveTabId],
	)

	const openNewHomeTab = useCallback(() => {
		const existing = tabs.find((tab) => tab.href === '/')

		if (existing) {
			navigationModeRef.current = 'switch-tab'
			syncActiveTabId(existing.id)
			router.push('/')
			return
		}

		const tab = createTab('/')
		navigationModeRef.current = 'new-tab'
		syncActiveTabId(tab.id)
		setTabs((current) => [...current, tab])
		router.push('/')
	}, [tabs, router, syncActiveTabId])

	const value = useMemo(
		() => ({
			tabs,
			activeTabId,
			activeHref,
			hasHydrated,
			closeTab,
			reorderTabs,
			updateTabLabel,
			openInNewTab,
			openNewHomeTab,
			activateTab,
		}),
		[
			tabs,
			activeTabId,
			activeHref,
			hasHydrated,
			closeTab,
			reorderTabs,
			updateTabLabel,
			openInNewTab,
			openNewHomeTab,
			activateTab,
		],
	)

	return (
		<OpenTabsContext.Provider value={value}>
			{children}
		</OpenTabsContext.Provider>
	)
}

export function useOpenTabs() {
	const context = useContext(OpenTabsContext)
	if (!context) {
		throw new Error('useOpenTabs must be used within OpenTabsProvider')
	}
	return context
}
