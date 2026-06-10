'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import type { OpenTab } from '@/lib/app-navigation'
import { cn } from '@/lib/utils'

interface TabFaceProps {
	tab: OpenTab
	isActive: boolean
	onClose: () => void
	onActivate?: () => void
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function TabFace({
	tab,
	isActive,
	onClose,
	onActivate,
	dragHandleProps,
}: TabFaceProps) {
	const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (isActive) {
			event.preventDefault()
			return
		}
		onActivate?.()
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
				'group relative flex max-w-[220px] min-w-[120px] shrink-0',
				isActive ? 'z-20 h-9' : 'z-10 h-8',
			)}
			data-tab-id={tab.id}
			data-tab-href={tab.href}
			{...dragHandleProps}
		>
			<Link
				href={tab.href}
				onClick={handleClick}
				aria-selected={isActive}
				aria-current={isActive ? 'page' : undefined}
				className={cn(
					'flex min-w-0 flex-1 items-center gap-2 pr-7 pl-3 text-sm font-medium',
					'rounded-t-[10px] border border-b-0 transition-all duration-150',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gt-navy',
					isActive
						? 'border-white/20 bg-gt-white !text-gt-navy shadow-[0_1px_0_0_#fff] visited:!text-gt-navy hover:!text-gt-navy dark:border-gt-gray-matter dark:bg-[var(--background)] dark:!text-foreground dark:shadow-none dark:visited:!text-foreground dark:hover:!text-foreground'
						: 'border-white/10 bg-white/10 !text-white visited:!text-white hover:bg-white/15 hover:!text-white',
				)}
			>
				<span className="truncate !text-inherit">{tab.label}</span>
			</Link>
			<button
				type="button"
				onPointerDown={handleClosePointerDown}
				onClick={handleCloseClick}
				className={cn(
					'absolute top-1/2 right-1.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full',
					'transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold',
					isActive
						? 'text-gt-gray-matter opacity-70 hover:bg-gt-pi-mile hover:text-gt-navy hover:opacity-100 dark:text-foreground-muted dark:hover:bg-gt-gray-matter/60'
						: 'text-white/80 opacity-0 hover:bg-white/20 hover:text-white group-hover:opacity-100 focus-visible:opacity-100',
				)}
				aria-label={`Close ${tab.label} tab`}
			>
				<X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
			</button>
		</div>
	)
}
