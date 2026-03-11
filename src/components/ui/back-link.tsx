'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BackLinkProps {
	href: string
	children: React.ReactNode
	className?: string
}

export function BackLink({ href, children, className }: BackLinkProps) {
	return (
		<Link
			href={href}
			className={cn(
				'inline-flex items-center gap-1.5 text-sm font-medium text-gt-navy hover:text-gt-bold-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded',
				className,
			)}
			aria-label={`Back to ${typeof children === 'string' ? children : 'previous'}`}
		>
			<svg
				className="h-4 w-4 shrink-0"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden
			>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
			</svg>
			{children}
		</Link>
	)
}
