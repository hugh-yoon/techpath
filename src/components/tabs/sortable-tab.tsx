'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { OpenTab } from '@/lib/app-navigation'
import { TabFace } from '@/components/tabs/tab-face'

interface SortableTabProps {
	tab: OpenTab
	isActive: boolean
	onClose: () => void
	onActivate: () => void
}

export function SortableTab({
	tab,
	isActive,
	onClose,
	onActivate,
}: SortableTabProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: tab.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<TabFace
				tab={tab}
				isActive={isActive}
				onClose={onClose}
				onActivate={onActivate}
				dragHandleProps={listeners}
			/>
		</div>
	)
}
