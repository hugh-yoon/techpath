'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
	createTab,
	isTabBarRoute,
	mergeTabsForPath,
	normalizeTabPath,
	reconcileStoredTabs,
	type OpenTab,
} from '@/lib/app-navigation'

const STORAGE_KEY = 'techpath-open-tabs'

interface OpenTabsContextValue {
	tabs: OpenTab[]
	activeHref: string
	hasHydrated: boolean
	closeTab: (id: string) => void
	reorderTabs: (activeId: string, overId: string) => void
	updateTabLabel: (href: string, label: string) => void
}

const OpenTabsContext = createContext<OpenTabsContextValue | null>(null)

export function OpenTabsProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() ?? '/'
	const router = useRouter()
	const [tabs, setTabs] = useState<OpenTab[]>([])
	const [hasHydrated, setHasHydrated] = useState(false)

	const activeHref = normalizeTabPath(pathname)

	useEffect(() => {
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY)
			const hrefs = raw ? (JSON.parse(raw) as string[]) : []
			const reconciled = reconcileStoredTabs(Array.isArray(hrefs) ? hrefs : [])

			if (reconciled.length === 0 && isTabBarRoute(activeHref) && activeHref !== '/') {
				setTabs([createTab(activeHref)])
			} else {
				setTabs(
					isTabBarRoute(activeHref)
						? mergeTabsForPath(reconciled, activeHref)
						: reconciled,
				)
			}
		} catch {
			if (isTabBarRoute(activeHref) && activeHref !== '/') {
				setTabs([createTab(activeHref)])
			}
		} finally {
			setHasHydrated(true)
		}
	}, [])

	useEffect(() => {
		if (!hasHydrated || !isTabBarRoute(activeHref)) return
		setTabs((current) => mergeTabsForPath(current, activeHref))
	}, [activeHref, hasHydrated])

	useEffect(() => {
		if (!hasHydrated) return
		try {
			sessionStorage.setItem(
				STORAGE_KEY,
				JSON.stringify(tabs.map((tab) => tab.href)),
			)
		} catch {
			// sessionStorage unavailable
		}
	}, [tabs, hasHydrated])

	const closeTab = useCallback(
		(id: string) => {
			setTabs((current) => {
				const index = current.findIndex((tab) => tab.id === id)
				if (index === -1) return current

				const closing = current[index]
				const next = current.filter((tab) => tab.id !== id)

				if (closing.href === activeHref) {
					const neighbor = next[index] ?? next[index - 1]
					router.push(neighbor?.href ?? '/')
				}

				return next
			})
		},
		[activeHref, router],
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

	const value = useMemo(
		() => ({
			tabs,
			activeHref,
			hasHydrated,
			closeTab,
			reorderTabs,
			updateTabLabel,
		}),
		[tabs, activeHref, hasHydrated, closeTab, reorderTabs, updateTabLabel],
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
