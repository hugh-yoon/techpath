'use client'

import { Course, CourseRedFlag } from '@/types'
import { AlertTriangle } from 'lucide-react'

const sortFlags = (flags: CourseRedFlag[] | null | undefined) =>
	[...(flags ?? [])].sort((a, b) => a.sort_order - b.sort_order)

interface CourseDiscoveryInsightsProps {
	course: Course
	className?: string
}

export function CourseDiscoveryInsights({ course, className = '' }: CourseDiscoveryInsightsProps) {
	const summary = course.deck_summary?.trim()
	const flags = sortFlags(course.course_red_flags)

	if (!summary && flags.length === 0) {
		return null
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{summary && (
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-foreground-muted">
						At a glance
					</p>
					<p className="mt-1 text-sm text-gt-navy dark:text-foreground">{summary}</p>
				</div>
			)}
			{flags.length > 0 && (
				<div
					className="rounded-lg border-2 border-red-500 bg-red-100 p-3 shadow-sm dark:border-red-500 dark:bg-red-950/60"
					role="status"
					aria-label="Peer-reported cautions"
				>
					<div className="mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
						<AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
						<span className="text-xs font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300">
							Red flags from students
						</span>
					</div>
					<ul className="list-inside list-disc space-y-2 text-sm font-semibold leading-snug text-red-600 dark:text-red-400">
						{flags.map((f) => (
							<li key={f.id}>{f.body}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
