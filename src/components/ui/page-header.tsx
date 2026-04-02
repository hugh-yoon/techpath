'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
	title: string
	subtitle?: string
	homeHref?: string
	className?: string
	children?: React.ReactNode
}

export function PageHeader({
	title,
	subtitle,
	homeHref,
	className,
	children,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				'border-b border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-6 py-8',
				className,
			)}
		>
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0 flex-1">
						{homeHref && (
							<Link
								href={homeHref}
								className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-gt-tech-gold px-3 py-1.5 text-sm font-medium text-gt-navy hover:bg-gt-tech-medium-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gt-navy"
								aria-label="Home"
							>
								<svg
									className="h-4 w-4 shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7-1a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-7-1h12"
									/>
								</svg>
								Home
							</Link>
						)}
						<h1 className="text-4xl font-bold text-gt-tech-gold mb-2">{title}</h1>
						{subtitle && (
							<p className="text-gt-white/80">{subtitle}</p>
						)}
					</div>
					{children}
				</div>
			</div>
		</div>
	)
}
