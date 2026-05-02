'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/page-header'
import { useCourseSearch } from '@/hooks/use-courses'
import { useInstructors } from '@/hooks/use-instructors'
import { useSearchStore } from '@/stores/search-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { DEPARTMENTS } from '@/utils/constants'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'
import { withReturnTo } from '@/lib/return-navigation'

const RESULT_CARD_MIN_H = 'min-h-[13.5rem]'

function DashboardResultsSkeleton() {
	return (
		<ul
			className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
			aria-hidden
		>
			{Array.from({ length: 6 }).map((_, i) => (
				<li key={i} className="flex h-full min-h-0">
					<div
						className={`flex w-full flex-col rounded-xl border-2 border-gt-navy/10 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface ${RESULT_CARD_MIN_H}`}
					>
						<Skeleton className="h-5 w-32" />
						<Skeleton className="mt-2 h-4 w-full max-w-[200px]" />
						<div className="mt-3 min-h-[4.5rem] flex-1 space-y-1.5">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
							<Skeleton className="h-3 w-3/5" />
						</div>
					</div>
				</li>
			))}
		</ul>
	)
}

const PAGE_SIZE = 20

export default function DashboardPage() {
	const pathname = usePathname()
	const { filters, setFilters } = useSearchStore()
	const { data: instructors } = useInstructors()
	const [page, setPage] = useState(0)
	const searchFilters = useMemo(
		() => ({
			department: filters.department || undefined,
			course_number: filters.course_number || undefined,
			course_name: filters.course_name || undefined,
			instructor_id: filters.instructor_id || undefined,
		}),
		[filters.department, filters.course_number, filters.course_name, filters.instructor_id],
	)
	const { data: results, isLoading, error } = useCourseSearch(searchFilters, {
		limit: PAGE_SIZE,
		offset: page * PAGE_SIZE,
	})
	const handlePrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), [])
	const handleNext = useCallback(() => setPage((p) => p + 1), [])

	return (
		<div className="min-h-screen bg-gt-white dark:bg-[var(--background)]">
			<PageHeader
				title="Course Search"
				subtitle="Find courses and sections by department, number, name, or instructor"
				backHref="/"
				homeHref="/"
			/>
			<div className="max-w-7xl mx-auto px-6 py-8">
			<div className="flex flex-wrap items-end gap-4 rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
				<div className="grid gap-1.5">
					<Label htmlFor="dept">Department</Label>
					<Select
						value={filters.department ?? '__all__'}
						onValueChange={(v) => setFilters({ department: v === '__all__' ? undefined : v })}
					>
						<SelectTrigger id="dept" className="w-[120px]">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All</SelectItem>
							{DEPARTMENTS.map((d) => (
								<SelectItem key={d} value={d}>
									{d}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-1.5">
					<Label htmlFor="num">Course Number</Label>
					<Input
						id="num"
						type="text"
						placeholder="e.g. 2110"
						className="w-28"
						value={filters.course_number ?? ''}
						onChange={(e) => setFilters({ course_number: e.target.value || undefined })}
					/>
				</div>
				<div className="grid gap-1.5">
					<Label htmlFor="name">Course Name</Label>
					<Input
						id="name"
						type="text"
						placeholder="Search by name"
						className="w-64"
						value={filters.course_name ?? ''}
						onChange={(e) => setFilters({ course_name: e.target.value || undefined })}
					/>
				</div>
				<div className="grid gap-1.5">
					<Label htmlFor="instructor">Instructor</Label>
					<Select
						value={filters.instructor_id ?? '__all__'}
						onValueChange={(v) => setFilters({ instructor_id: v === '__all__' ? undefined : v })}
					>
						<SelectTrigger id="instructor" className="w-[200px]">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All</SelectItem>
							{instructors.map((i) => (
								<SelectItem key={i.id} value={i.id}>
									{i.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			{error && (
				<p className="mt-4 text-red-600" role="alert">
					{error.message}
				</p>
			)}
			{isLoading ? (
				<DashboardResultsSkeleton />
			) : (
				<ul
					className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
					aria-label="Search results"
				>
					{results.map((course, i) => (
						<motion.li
							key={course.id}
							className="flex h-full min-h-0"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, delay: i * 0.03 }}
						>
							<Link
								href={withReturnTo(`/course/${course.id}`, pathname)}
								className={`flex w-full flex-col rounded-xl border-2 border-gt-navy/10 bg-gt-white p-4 transition-colors hover:border-gt-tech-gold/40 hover:bg-gt-diploma hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2 dark:border-gt-gray-matter dark:bg-surface dark:hover:bg-gt-gray-matter/50 ${RESULT_CARD_MIN_H}`}
							>
								<h2 className="shrink-0 font-semibold text-gt-navy dark:text-foreground">
									{course.department} {course.course_number}
								</h2>
								<p className="mt-1 line-clamp-2 shrink-0 text-sm text-gt-gray-matter dark:text-foreground-muted">
									{course.course_name}
								</p>
								<div className="mt-2 flex min-h-[4.5rem] flex-1 flex-col">
									{course.sections && course.sections.length > 0 ? (
										<ul className="space-y-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
											{course.sections.slice(0, 3).map((s) => (
												<li key={s.id}>
													{s.section_code} — {s.instructor?.name ?? 'TBA'} —{' '}
													{formatDaysShort(s.day_pattern)}{' '}
													{formatTimeDisplay(s.start_time)}
												</li>
											))}
											{course.sections.length > 3 && (
												<li>+{course.sections.length - 3} more</li>
											)}
										</ul>
									) : (
										<p className="text-xs text-gt-gray-matter/70 dark:text-foreground-muted/80">
											No sections listed
										</p>
									)}
								</div>
							</Link>
						</motion.li>
					))}
				</ul>
			)}
			{!isLoading && !error && results.length === 0 && (
				<p className="mt-6 text-gt-gray-matter dark:text-foreground-muted">No courses match your filters.</p>
			)}
			{!isLoading && results.length > 0 && (
				<nav
					className="mt-6 flex items-center gap-4"
					aria-label="Search results pagination"
				>
					<button
						type="button"
						onClick={handlePrev}
						disabled={page === 0}
						className="rounded-lg border-2 border-gt-navy/20 px-4 py-2 text-sm font-medium text-gt-navy transition-colors hover:bg-gt-navy/10 disabled:opacity-50 dark:border-gt-gray-matter dark:text-foreground"
						aria-label="Previous page"
					>
						Previous
					</button>
					<span className="text-sm text-gt-gray-matter dark:text-foreground-muted">
						Page {page + 1}
					</span>
					<button
						type="button"
						onClick={handleNext}
						disabled={results.length < PAGE_SIZE}
						className="rounded-lg border-2 border-gt-navy/20 px-4 py-2 text-sm font-medium text-gt-navy transition-colors hover:bg-gt-navy/10 disabled:opacity-50 dark:border-gt-gray-matter dark:text-foreground"
						aria-label="Next page"
					>
						Next
					</button>
				</nav>
			)}
			</div>
		</div>
	)
}
