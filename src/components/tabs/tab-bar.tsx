'use client'

import { useRef, useState } from 'react'
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	closestCenter,
	type DragEndEvent,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	horizontalListSortingStrategy,
	sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { usePathname } from 'next/navigation'
import { useOpenTabs } from '@/context/open-tabs-provider'
import { isTabBarRoute } from '@/lib/app-navigation'
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll'
import { SortableTab } from '@/components/tabs/sortable-tab'
import { TabFace } from '@/components/tabs/tab-face'

export function TabBar() {
	const pathname = usePathname() ?? '/'
	const scrollRef = useRef<HTMLDivElement>(null)
	const {
		tabs,
		activeHref,
		hasHydrated,
		closeTab,
		reorderTabs,
	} = useOpenTabs()
	const [activeDragId, setActiveDragId] = useState<string | null>(null)

	useTabBarScroll(scrollRef, activeHref)

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	if (!hasHydrated || !isTabBarRoute(pathname) || tabs.length === 0) {
		return null
	}

	const overlayTab = activeDragId
		? tabs.find((tab) => tab.id === activeDragId)
		: null

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		setActiveDragId(null)
		if (!over || active.id === over.id) return
		reorderTabs(String(active.id), String(over.id))
	}

	return (
		<div
			className="sticky top-0 z-40 border-b border-gt-navy/15 bg-gt-diploma dark:border-gt-gray-matter dark:bg-[var(--background)]"
			role="tablist"
			aria-label="Open pages"
		>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={({ active }) => setActiveDragId(String(active.id))}
				onDragCancel={() => setActiveDragId(null)}
				onDragEnd={handleDragEnd}
			>
				<div
					ref={scrollRef}
					className="flex overflow-x-auto overscroll-x-contain px-2 pt-2 [scrollbar-width:thin]"
				>
					<SortableContext
						items={tabs.map((tab) => tab.id)}
						strategy={horizontalListSortingStrategy}
					>
						{tabs.map((tab) => (
							<SortableTab
								key={tab.id}
								tab={tab}
								isActive={tab.href === activeHref}
								onClose={() => closeTab(tab.id)}
							/>
						))}
					</SortableContext>
				</div>
				<DragOverlay>
					{overlayTab ? (
						<div className="opacity-90 shadow-md">
							<TabFace
								tab={overlayTab}
								isActive={overlayTab.href === activeHref}
								onClose={() => closeTab(overlayTab.id)}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	)
}
