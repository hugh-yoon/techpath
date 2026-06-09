'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
	useAdminCourseReviews,
	useAdminInstructorReviews,
} from '@/hooks/use-admin-reviews-page'
import { BackLink } from '@/components/ui/back-link'
import { Button } from '@/components/ui/button'
import { DataPagination } from '@/components/ui/data-pagination'
import { AdminTableToolbar } from '@/components/admin/admin-table-toolbar'
import { ReviewSourceBadge } from '@/components/reviews'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import type { ReviewSource } from '@/types'

export default function AdminReviewsPage() {
	const [activeTab, setActiveTab] = useState('course')
	const [courseSearch, setCourseSearch] = useState('')
	const [coursePage, setCoursePage] = useState(0)
	const [instructorSearch, setInstructorSearch] = useState('')
	const [instructorPage, setInstructorPage] = useState(0)
	const [sourceFilter, setSourceFilter] = useState<ReviewSource | 'all'>('all')
	const [ratingFilter, setRatingFilter] = useState('all')

	useEffect(() => {
		setCoursePage(0)
	}, [courseSearch])

	useEffect(() => {
		setInstructorPage(0)
	}, [instructorSearch, sourceFilter, ratingFilter])

	const {
		data: courseReviews,
		totalCount: courseTotal,
		pageSize: coursePageSize,
		isLoading: courseLoading,
		error: courseError,
		refetch: refetchCourse,
	} = useAdminCourseReviews({ page: coursePage, search: courseSearch })

	const {
		data: instructorReviews,
		totalCount: instructorTotal,
		pageSize: instructorPageSize,
		isLoading: instructorLoading,
		error: instructorError,
		refetch: refetchInstructor,
	} = useAdminInstructorReviews({
		page: instructorPage,
		search: instructorSearch,
		source: sourceFilter,
		rating: ratingFilter,
	})

	const handleDeleteCourseReview = useCallback(
		async (id: string) => {
			if (!confirm('Delete this review?')) return
			await supabase.from('course_reviews').delete().eq('id', id)
			await refetchCourse()
		},
		[refetchCourse],
	)

	const handleDeleteInstructorReview = useCallback(
		async (id: string) => {
			if (!confirm('Delete this review?')) return
			await supabase.from('instructor_reviews').delete().eq('id', id)
			await refetchInstructor()
		},
		[refetchInstructor],
	)

	const error = courseError ?? instructorError

	return (
		<div>
			<div className="mb-4">
				<BackLink href="/admin">Admin</BackLink>
			</div>
			<h1 className="text-xl font-semibold">Reviews</h1>
			<p className="mt-1 text-sm text-gt-gray-matter dark:text-foreground-muted">
				View and delete only. Students submit from course/instructor pages.
			</p>
			{error && (
				<p className="mt-2 text-red-600" role="alert">
					{error.message}
				</p>
			)}
			<Tabs.Root
				value={activeTab}
				onValueChange={setActiveTab}
				className="mt-4"
			>
				<Tabs.List className="inline-flex gap-1 rounded-lg border border-gt-pi-mile p-1 dark:border-gt-gray-matter">
					<Tabs.Trigger
						value="course"
						className={cn(
							'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
							'data-[state=active]:bg-gt-navy data-[state=active]:text-gt-white dark:data-[state=active]:bg-gt-pi-mile dark:data-[state=active]:text-gt-navy',
						)}
					>
						Course Reviews
					</Tabs.Trigger>
					<Tabs.Trigger
						value="instructor"
						className={cn(
							'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
							'data-[state=active]:bg-gt-navy data-[state=active]:text-gt-white dark:data-[state=active]:bg-gt-pi-mile dark:data-[state=active]:text-gt-navy',
						)}
					>
						Instructor Reviews
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="course" className="mt-4">
					<AdminTableToolbar
						searchId="course-review-search"
						searchLabel="Search"
						searchPlaceholder="Comment text"
						searchValue={courseSearch}
						onSearchChange={setCourseSearch}
						resultCount={courseTotal}
					/>
					{courseLoading ? (
						<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
					) : (
						<>
							<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Course</TableHead>
											<TableHead>Rating</TableHead>
											<TableHead>Difficulty</TableHead>
											<TableHead>Comment</TableHead>
											<TableHead className="w-[80px]">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{courseReviews.map((r) => (
											<TableRow key={r.id}>
												<TableCell>
													{r.course
														? `${r.course.department} ${r.course.course_number}`
														: r.course_id}
												</TableCell>
												<TableCell>{r.rating}</TableCell>
												<TableCell>{r.difficulty}</TableCell>
												<TableCell className="max-w-[200px] truncate">
													{r.comment ?? '—'}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														className="text-red-600"
														onClick={() => handleDeleteCourseReview(r.id)}
														aria-label="Delete review"
													>
														Delete
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<DataPagination
								page={coursePage}
								totalCount={courseTotal}
								pageSize={coursePageSize}
								onPageChange={setCoursePage}
								ariaLabel="Course reviews pagination"
							/>
						</>
					)}
				</Tabs.Content>
				<Tabs.Content value="instructor" className="mt-4">
					<AdminTableToolbar
						searchId="instructor-review-search"
						searchLabel="Search"
						searchPlaceholder="Comment or course context"
						searchValue={instructorSearch}
						onSearchChange={setInstructorSearch}
						resultCount={instructorTotal}
						filters={[
							{
								id: 'source-filter',
								label: 'Source',
								value: sourceFilter,
								onChange: (v) => setSourceFilter(v as ReviewSource | 'all'),
								options: [
									{ value: 'all', label: 'All sources' },
									{ value: 'student', label: 'TechPlan student' },
									{ value: 'rmp', label: 'Rate My Professors' },
								],
							},
							{
								id: 'rating-filter',
								label: 'Rating',
								value: ratingFilter,
								onChange: setRatingFilter,
								options: [
									{ value: 'all', label: 'All ratings' },
									{ value: '5', label: '5 stars' },
									{ value: '4', label: '4 stars' },
									{ value: '3', label: '3 stars' },
									{ value: '2', label: '2 stars' },
									{ value: '1', label: '1 star' },
								],
							},
						]}
					/>
					{instructorLoading ? (
						<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
					) : (
						<>
							<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Source</TableHead>
											<TableHead>Instructor</TableHead>
											<TableHead>Rating</TableHead>
											<TableHead>Course</TableHead>
											<TableHead>Comment</TableHead>
											<TableHead className="w-[80px]">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{instructorReviews.map((r) => (
											<TableRow key={r.id}>
												<TableCell>
													<ReviewSourceBadge source={r.source} />
												</TableCell>
												<TableCell>
													{r.instructor?.name ?? r.instructor_id}
												</TableCell>
												<TableCell>{r.rating}</TableCell>
												<TableCell className="max-w-[120px] truncate">
													{r.course_context ?? '—'}
												</TableCell>
												<TableCell className="max-w-[200px] truncate">
													{r.comment ?? '—'}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														className="text-red-600"
														onClick={() => handleDeleteInstructorReview(r.id)}
														aria-label="Delete review"
													>
														Delete
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<DataPagination
								page={instructorPage}
								totalCount={instructorTotal}
								pageSize={instructorPageSize}
								onPageChange={setInstructorPage}
								ariaLabel="Instructor reviews pagination"
							/>
						</>
					)}
				</Tabs.Content>
			</Tabs.Root>
		</div>
	)
}
