'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { TAB_BAR_CHROME } from '@/lib/page-chrome'
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll'
import { SortableTab } from '@/components/tabs/sortable-tab'
import { TabFace } from '@/components/tabs/tab-face'
import { cn } from '@/lib/utils'

export function TabBar() {
	const pathname = usePathname() ?? '/'
	const scrollRef = useRef<HTMLDivElement>(null)
	const {
		tabs,
		activeTabId,
		hasHydrated,
		closeTab,
		reorderTabs,
		openNewHomeTab,
		activateTab,
	} = useOpenTabs()
	const [activeDragId, setActiveDragId] = useState<string | null>(null)

	useTabBarScroll(scrollRef, activeTabId)

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
			className={cn('sticky top-0 z-40', TAB_BAR_CHROME)}
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
				<div className="flex items-end gap-1 px-2 pt-1.5 pb-0">
					<div
						ref={scrollRef}
						className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20"
					>
						<SortableContext
							items={tabs.map((tab) => tab.id)}
							strategy={horizontalListSortingStrategy}
						>
							{tabs.map((tab) => (
								<SortableTab
									key={tab.id}
									tab={tab}
									isActive={tab.id === activeTabId}
									onClose={() => closeTab(tab.id)}
									onActivate={() => activateTab(tab.id)}
								/>
							))}
						</SortableContext>
					</div>
					<button
						type="button"
						onClick={openNewHomeTab}
						className={cn(
							'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
							'text-white/70 transition-colors hover:bg-white/12 hover:text-white',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold',
						)}
						aria-label="Open new home tab"
						title="New tab"
					>
						<Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
					</button>
				</div>
				<DragOverlay>
					{overlayTab ? (
						<div className="opacity-95 shadow-lg">
							<TabFace
								tab={overlayTab}
								isActive={overlayTab.id === activeTabId}
								onClose={() => closeTab(overlayTab.id)}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	)
}
