'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { BackLink } from '@/components/ui/back-link'
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
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'

const PAGE_SIZE = 20

export default function DashboardPage() {
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
		<div className="min-h-screen bg-gt-white p-6 dark:bg-[var(--background)]">
			<div className="mb-4">
				<BackLink href="/">Home</BackLink>
			</div>
			<h1 className="text-xl font-semibold text-gt-navy dark:text-foreground">Course Search</h1>
			<div className="mt-4 flex flex-wrap items-end gap-4 rounded-lg border border-gt-pi-mile bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
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
				<p className="mt-6 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
			) : (
				<ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Search results">
					{results.map((course) => (
						<li key={course.id}>
							<Link
								href={`/course/${course.id}`}
								className="block rounded-lg border border-gt-pi-mile bg-gt-white p-4 transition-colors hover:bg-gt-diploma dark:border-gt-gray-matter dark:bg-surface dark:hover:bg-gt-gray-matter/50"
							>
								<h2 className="font-semibold text-gt-navy dark:text-foreground">
									{course.department} {course.course_number}
								</h2>
								<p className="mt-1 text-sm text-gt-gray-matter dark:text-foreground-muted">
									{course.course_name}
								</p>
								{course.sections && course.sections.length > 0 && (
									<ul className="mt-2 space-y-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
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
								)}
							</Link>
						</li>
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
						className="rounded border border-gt-pi-mile px-3 py-1.5 text-sm text-gt-navy disabled:opacity-50 dark:border-gt-gray-matter dark:text-foreground"
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
						className="rounded border border-gt-pi-mile px-3 py-1.5 text-sm text-gt-navy disabled:opacity-50 dark:border-gt-gray-matter dark:text-foreground"
						aria-label="Next page"
					>
						Next
					</button>
				</nav>
			)}
		</div>
	)
}
