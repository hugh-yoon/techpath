'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BackLink } from '@/components/ui/back-link'
import { Button } from '@/components/ui/button'
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

interface CourseReviewRow {
	id: string
	course_id: string
	rating: number
	difficulty: number
	comment: string | null
	course?: { department: string; course_number: number } | null
}

interface InstructorReviewRow {
	id: string
	instructor_id: string
	rating: number
	comment: string | null
	instructor?: { name: string } | null
}

export default function AdminReviewsPage() {
	const [courseReviews, setCourseReviews] = useState<CourseReviewRow[]>([])
	const [instructorReviews, setInstructorReviews] = useState<InstructorReviewRow[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const [courseRes, instructorRes] = await Promise.all([
			supabase
				.from('course_reviews')
				.select('id, course_id, rating, difficulty, comment, course:courses(department, course_number)'),
			supabase
				.from('instructor_reviews')
				.select('id, instructor_id, rating, comment, instructor:instructors(name)'),
		])
		if (courseRes.error) setError(courseRes.error as Error)
		if (instructorRes.error) setError(instructorRes.error as Error)
		const courseData = (courseRes.data ?? []) as Array<Record<string, unknown>>
		setCourseReviews(
			courseData.map((r) => ({
				id: r.id,
				course_id: r.course_id,
				rating: r.rating,
				difficulty: r.difficulty,
				comment: r.comment,
				course: Array.isArray(r.course) ? r.course[0] : r.course,
			})) as CourseReviewRow[],
		)
		const instructorData = (instructorRes.data ?? []) as Array<Record<string, unknown>>
		setInstructorReviews(
			instructorData.map((r) => ({
				id: r.id,
				instructor_id: r.instructor_id,
				rating: r.rating,
				comment: r.comment,
				instructor: Array.isArray(r.instructor) ? r.instructor[0] : r.instructor,
			})) as InstructorReviewRow[],
		)
		setIsLoading(false)
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const handleDeleteCourseReview = useCallback(
		async (id: string) => {
			if (!confirm('Delete this review?')) return
			await supabase.from('course_reviews').delete().eq('id', id)
			await load()
		},
		[load],
	)

	const handleDeleteInstructorReview = useCallback(
		async (id: string) => {
			if (!confirm('Delete this review?')) return
			await supabase.from('instructor_reviews').delete().eq('id', id)
			await load()
		},
		[load],
	)

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
			<Tabs.Root defaultValue="course" className="mt-4">
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
					{isLoading ? (
						<p className="text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
					) : (
						<div className="overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
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
					)}
				</Tabs.Content>
				<Tabs.Content value="instructor" className="mt-4">
					{isLoading ? (
						<p className="text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
					) : (
						<div className="overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Instructor</TableHead>
										<TableHead>Rating</TableHead>
										<TableHead>Comment</TableHead>
										<TableHead className="w-[80px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{instructorReviews.map((r) => (
										<TableRow key={r.id}>
											<TableCell>
												{r.instructor?.name ?? r.instructor_id}
											</TableCell>
											<TableCell>{r.rating}</TableCell>
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
					)}
				</Tabs.Content>
			</Tabs.Root>
		</div>
	)
}
