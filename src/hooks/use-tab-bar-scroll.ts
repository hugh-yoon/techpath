'use client'

import { useEffect, type RefObject } from 'react'

export function useTabBarScroll(
	containerRef: RefObject<HTMLElement | null>,
	activeTabId: string | null,
) {
	useEffect(() => {
		const container = containerRef.current
		if (!container || !activeTabId) return

		const activeTab = container.querySelector(
			`[data-tab-id="${CSS.escape(activeTabId)}"]`,
		)
		activeTab?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
	}, [activeTabId, containerRef])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleWheel = (event: WheelEvent) => {
			if (event.deltaY === 0) return
			container.scrollLeft += event.deltaY
			event.preventDefault()
		}

		container.addEventListener('wheel', handleWheel, { passive: false })
		return () => container.removeEventListener('wheel', handleWheel)
	}, [containerRef])
}
