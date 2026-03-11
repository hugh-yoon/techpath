import Link from 'next/link'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen bg-gt-white dark:bg-[var(--background)]">
			<aside className="w-56 border-r border-gt-pi-mile bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
				<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-gt-pi-mile">
					Admin
				</h2>
				<nav className="flex flex-col gap-1" aria-label="Admin">
					<Link
						href="/admin"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Dashboard
					</Link>
					<Link
						href="/admin/courses"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Courses
					</Link>
					<Link
						href="/admin/instructors"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Instructors
					</Link>
					<Link
						href="/admin/sections"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Sections
					</Link>
					<Link
						href="/admin/prerequisites"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Prerequisites
					</Link>
					<Link
						href="/admin/reviews"
						className="rounded px-3 py-2 text-sm text-gt-navy hover:bg-gt-pi-mile"
					>
						Reviews
					</Link>
					<Link
						href="/"
						className="mt-4 rounded px-3 py-2 text-sm text-gt-gray-matter hover:bg-gt-pi-mile"
					>
						← Back to app
					</Link>
				</nav>
			</aside>
			<main className="flex-1 bg-gt-white p-6 dark:bg-[var(--background)]">{children}</main>
		</div>
	)
}
