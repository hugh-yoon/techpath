'use client'

import Link from 'next/link'
import { useAdminStats } from '@/hooks/use-admin-stats'
import { AdminSyncControls } from '@/components/admin/admin-sync-controls'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
	label: string
	value: number | string
	detail?: string
	isLoading?: boolean
}

function StatCard({ label, value, detail, isLoading }: StatCardProps) {
	return (
		<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-5 dark:border-gt-gray-matter dark:bg-surface">
			<p className="text-xs font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-foreground-muted">
				{label}
			</p>
			{isLoading ? (
				<Skeleton className="mt-3 h-9 w-24" />
			) : (
				<p className="mt-2 text-3xl font-bold tabular-nums text-gt-navy dark:text-foreground">
					{value}
				</p>
			)}
			{detail && (
				<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
					{detail}
				</p>
			)}
		</div>
	)
}

export default function AdminDashboardPage() {
	const { stats, error, isLoading, refetch } = useAdminStats()

	return (
		<div className="max-w-5xl">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-xl font-semibold text-gt-navy dark:text-foreground">
						Admin Dashboard
					</h1>
					<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
						Live counts from Banner schedule data, instructors, and
						reviews. Use manual sync when you need data outside the cron
						schedule.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isLoading}
					aria-label="Refresh dashboard counts"
				>
					Refresh counts
				</Button>
			</div>

			{error && (
				<p className="mt-4 text-sm text-destructive" role="alert">
					{error.message}
				</p>
			)}

			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<StatCard
					label="Loaded classes"
					value={stats?.loadedCourseCount.toLocaleString() ?? '—'}
					detail={
						stats
							? `${stats.totalCourseCatalogCount.toLocaleString()} courses in catalog total`
							: undefined
					}
					isLoading={isLoading}
				/>
				<StatCard
					label="Active sections"
					value={stats?.activeSectionCount.toLocaleString() ?? '—'}
					detail={
						stats
							? `${stats.bannerSectionCount.toLocaleString()} Banner · ${stats.seedSectionCount.toLocaleString()} legacy seed`
							: undefined
					}
					isLoading={isLoading}
				/>
				<StatCard
					label="Schedule instructors"
					value={stats?.scheduledInstructorCount.toLocaleString() ?? '—'}
					detail={
						stats
							? `${stats.totalInstructorRecords.toLocaleString()} instructor records · ${stats.orphanInstructorCount.toLocaleString()} without sections`
							: undefined
					}
					isLoading={isLoading}
				/>
				<StatCard
					label="Reviews"
					value={stats?.reviewCount.toLocaleString() ?? '—'}
					detail={
						stats
							? `${stats.courseReviewCount.toLocaleString()} course · ${stats.instructorReviewCount.toLocaleString()} instructor`
							: undefined
					}
					isLoading={isLoading}
				/>
			</div>

			<AdminSyncControls onComplete={refetch} />

			<section
				className="mt-8 rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-5 dark:border-gt-gray-matter dark:bg-surface"
				aria-labelledby="data-status-heading"
			>
				<h2
					id="data-status-heading"
					className="text-base font-semibold text-gt-navy dark:text-foreground"
				>
					Data sources
				</h2>
				<div className="mt-3 space-y-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
					<p>
						<strong className="text-gt-navy dark:text-foreground">
							Banner
						</strong>{' '}
						is the source of truth for courses, sections, and real
						instructor names. Legacy seed rows (no term) remain until
						deactivated after Banner coverage is confirmed.
					</p>
					<p>
						<strong className="text-gt-navy dark:text-foreground">
							CS / CSE
						</strong>{' '}
						were skipped when earlier Banner batches failed on recitation
						course numbers and pagination. Use{' '}
						<strong className="text-gt-navy dark:text-foreground">
							Banner CS + CSE
						</strong>{' '}
						above to reload them.
					</p>
					<p>
						Review run history on{' '}
						<Link
							href="/admin/sync-jobs"
							className="text-gt-navy underline hover:text-gt-bold-blue dark:text-link"
						>
							Sync Jobs
						</Link>{' '}
						and low-confidence matches on{' '}
						<Link
							href="/admin/rmp-matches"
							className="text-gt-navy underline hover:text-gt-bold-blue dark:text-link"
						>
							RMP Matches
						</Link>
						.
					</p>
				</div>
			</section>

			<nav
				className="mt-8 flex flex-wrap gap-2"
				aria-label="Admin quick links"
			>
				{[
					{ href: '/admin/courses', label: 'Courses' },
					{ href: '/admin/sections', label: 'Sections' },
					{ href: '/admin/instructors', label: 'Instructors' },
					{ href: '/admin/reviews', label: 'Reviews' },
					{ href: '/admin/sync-jobs', label: 'Sync Jobs' },
				].map(({ href, label }) => (
					<Link
						key={href}
						href={href}
						className="rounded-lg border-2 border-gt-navy/15 px-3 py-2 text-sm font-medium text-gt-navy transition-colors hover:bg-gt-navy/5 dark:border-gt-gray-matter dark:text-foreground dark:hover:bg-surface"
					>
						{label}
					</Link>
				))}
			</nav>
		</div>
	)
}
