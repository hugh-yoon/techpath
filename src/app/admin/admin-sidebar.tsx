'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
	{ href: '/admin', label: 'Dashboard' },
	{ href: '/admin/courses', label: 'Courses' },
	{ href: '/admin/instructors', label: 'Instructors' },
	{ href: '/admin/sections', label: 'Sections' },
	{ href: '/admin/prerequisites', label: 'Prerequisites' },
	{ href: '/admin/reviews', label: 'Reviews' },
] as const

export function AdminSidebar() {
	const pathname = usePathname()

	return (
		<aside className="w-56 shrink-0 border-r border-gt-pi-mile bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
			<Link
				href="/"
				className="mb-3 flex items-center rounded px-3 py-2 text-sm font-medium text-gt-navy hover:bg-gt-tech-gold/20 hover:text-gt-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				title="Home"
			>
				Home
			</Link>
			<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gt-navy">
				Admin
			</h2>
			<nav className="flex flex-col gap-1" aria-label="Admin">
				{NAV_ITEMS.map(({ href, label }) => {
					const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								'rounded px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-gt-tech-gold text-gt-navy hover:opacity-90'
									: 'text-gt-navy hover:bg-gt-pi-mile',
							)}
						>
							{label}
						</Link>
					)
				})}
			</nav>
		</aside>
	)
}
