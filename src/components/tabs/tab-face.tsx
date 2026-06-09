'use client'

import Link from 'next/link'
import type { OpenTab } from '@/lib/app-navigation'
import { cn } from '@/lib/utils'

interface TabFaceProps {
	tab: OpenTab
	isActive: boolean
	onClose: () => void
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function TabFace({
	tab,
	isActive,
	onClose,
	dragHandleProps,
}: TabFaceProps) {
	const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (isActive) event.preventDefault()
	}

	const handleClosePointerDown = (event: React.PointerEvent) => {
		event.stopPropagation()
	}

	const handleCloseClick = (event: React.MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		onClose()
	}

	return (
		<div
			className={cn(
				'group flex min-w-0 max-w-[200px] shrink-0 items-stretch',
				isActive ? 'z-10' : 'z-0',
			)}
			data-tab-href={tab.href}
			{...dragHandleProps}
		>
			<Link
				href={tab.href}
				onClick={handleClick}
				aria-selected={isActive}
				aria-current={isActive ? 'page' : undefined}
				className={cn(
					'flex min-w-0 flex-1 items-center gap-2 border border-b-0 px-3 py-2 text-sm transition-colors',
					'rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold',
					isActive
						? 'border-gt-navy/20 bg-gt-white text-gt-navy dark:border-gt-gray-matter dark:bg-surface dark:text-foreground'
						: 'border-transparent bg-gt-diploma/80 text-gt-gray-matter hover:bg-gt-pi-mile/60 dark:bg-surface/60 dark:text-foreground-muted dark:hover:bg-gt-gray-matter/40',
				)}
			>
				<span className="truncate">{tab.label}</span>
			</Link>
			<button
				type="button"
				onPointerDown={handleClosePointerDown}
				onClick={handleCloseClick}
				className={cn(
					'flex w-8 shrink-0 items-center justify-center border border-b-0 text-base leading-none',
					'rounded-tr-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold',
					isActive
						? 'border-gt-navy/20 bg-gt-white text-gt-gray-matter hover:bg-gt-pi-mile dark:border-gt-gray-matter dark:bg-surface dark:hover:bg-gt-gray-matter/50'
						: 'border-transparent bg-gt-diploma/80 text-gt-gray-matter hover:bg-gt-pi-mile/60 dark:bg-surface/60 dark:hover:bg-gt-gray-matter/40',
				)}
				aria-label={`Close ${tab.label} tab`}
			>
				×
			</button>
		</div>
	)
}
