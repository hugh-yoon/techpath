'use client'

import Link from 'next/link'
import { OpenInNewTabButton } from '@/components/tabs/open-in-new-tab-button'
import { cn } from '@/lib/utils'

interface TabNavLinkProps {
	href: string
	children: React.ReactNode
	newTabLabel: string
	tabLabel?: string
	className?: string
}

/** Inline navigation link with a companion open-in-new-tab control. */
export function TabNavLink({
	href,
	children,
	newTabLabel,
	tabLabel,
	className,
}: TabNavLinkProps) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<Link href={href} className={className}>
				{children}
			</Link>
			<OpenInNewTabButton
				href={href}
				newTabLabel={newTabLabel}
				tabLabel={tabLabel}
			/>
		</span>
	)
}
