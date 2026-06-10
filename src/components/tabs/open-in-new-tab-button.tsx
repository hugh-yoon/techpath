'use client'

import { Plus } from 'lucide-react'
import { useOpenTabs } from '@/context/open-tabs-provider'
import { cn } from '@/lib/utils'

interface OpenInNewTabButtonProps {
	href: string
	/** Shown in hover tooltip, e.g. "Instructor Information" */
	newTabLabel: string
	/** Optional label for the tab strip; defaults to nav registry lookup */
	tabLabel?: string
	className?: string
}

export function OpenInNewTabButton({
	href,
	newTabLabel,
	tabLabel,
	className,
}: OpenInNewTabButtonProps) {
	const { openInNewTab } = useOpenTabs()
	const tooltip = `Open new tab with ${newTabLabel}`

	const handleClick = (event: React.MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		openInNewTab(href, tabLabel)
	}

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			event.stopPropagation()
			openInNewTab(href, tabLabel)
		}
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			title={tooltip}
			aria-label={tooltip}
			className={cn(
				'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm',
				'border border-gt-navy/20 bg-gt-white/80 text-gt-navy shadow-sm',
				'transition-colors hover:border-gt-tech-gold hover:bg-gt-tech-gold/20 hover:text-gt-navy',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold',
				'dark:border-gt-gray-matter dark:bg-surface dark:text-foreground',
				className,
			)}
		>
			<Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
		</button>
	)
}
