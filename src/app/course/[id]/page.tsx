'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BackLink } from '@/components/ui/back-link'
import { PageHeader } from '@/components/ui/page-header'
import { useCourse, useCourseReviews } from '@/hooks'
import { useSectionsByCourse } from '@/hooks/use-sections'
import { AddToScheduleDialog } from '@/components/course/add-to-schedule-dialog'
import { CourseReviewDialog } from '@/components/course/course-review-dialog'
import { SectionReviewsBlock } from '@/components/course/section-reviews-block'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'
import { CourseDiscoveryInsights } from '@/components/course/course-discovery-insights'

export default function CourseDetailPage() {
	const params = useParams()
	const id = params?.id as string
	const { data: course, error: courseError, isLoading: courseLoading } = useCourse(id)
	const { data: sections, isLoading: sectionsLoading } = useSectionsByCourse(id)
	const { data: courseReviews, isLoading: courseReviewsLoading, refetch: refetchCourseReviews } =
		useCourseReviews(id)
	const [courseReviewDialogOpen, setCourseReviewDialogOpen] = useState(false)
	const [addToScheduleSectionId, setAddToScheduleSectionId] = useState<string | null>(null)

	if (courseLoading || !id) {
		return (
			<div className="min-h-screen bg-gt-white dark:bg-background">
				<PageHeader title="" subtitle="" homeHref="/" />
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6 dark:border-gt-gray-matter dark:bg-surface">
						<div className="flex flex-wrap gap-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
						<Skeleton className="mt-4 h-4 w-full" />
						<Skeleton className="mt-2 h-4 w-3/4" />
					</div>
					<section className="mt-8">
						<Skeleton className="h-6 w-24" />
						<div className="mt-4 space-y-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface"
								>
									<Skeleton className="h-4 w-28" />
									<Skeleton className="mt-2 h-3 w-48" />
									<Skeleton className="mt-1 h-3 w-32" />
								</div>
							))}
						</div>
					</section>
				</div>
			</div>
		)
	}
	if (courseError || !course) {
		return (
			<div className="p-6">
				<p className="text-red-600" role="alert">
					{courseError?.message ?? 'Course not found'}
				</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gt-white dark:bg-background">
			<PageHeader
				title={`${course.department} ${course.course_number}`}
				subtitle={course.course_name}
				homeHref="/"
			>
				<BackLink href="/dashboard" className="text-gt-tech-gold/90 hover:text-gt-tech-gold">
					Search
				</BackLink>
			</PageHeader>
			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6 dark:border-gt-gray-matter dark:bg-surface">
					<div className="flex flex-wrap gap-4 text-sm">
						<span className="text-gt-navy dark:text-foreground">
							Credit hours: {course.credit_hours}
						</span>
						{course.difficulty_rating != null && (
							<span className="text-gt-navy dark:text-foreground">
								Difficulty: {course.difficulty_rating}/5
							</span>
						)}
					</div>
					<CourseDiscoveryInsights course={course} className="mt-4" />
					{course.description && (
						<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">
							{course.description}
						</p>
					)}
				</div>

			<section className="mt-8" aria-labelledby="sections-heading">
				<h2 id="sections-heading" className="text-xl font-bold text-gt-navy dark:text-foreground">
					Sections
				</h2>
				{sectionsLoading ? (
					<div className="mt-4 space-y-4" aria-hidden>
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface"
							>
								<Skeleton className="h-4 w-28" />
								<Skeleton className="mt-2 h-3 w-48" />
								<Skeleton className="mt-1 h-3 w-32" />
							</div>
						))}
					</div>
				) : (
					<ul className="mt-4 space-y-4">
						{sections.map((s, i) => (
							<motion.li
								key={s.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2, delay: i * 0.04 }}
								className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<span className="font-medium">Section {s.section_code}</span>
										<span className="mx-2 text-gt-gray-matter">·</span>
										<Link
											href={`/instructor/${s.instructor_id}`}
											className="text-gt-navy underline hover:text-gt-bold-blue dark:text-foreground dark:hover:text-link-hover"
										>
											{s.instructor?.name ?? 'TBA'}
										</Link>
										<span className="mx-2 text-gt-gray-matter">·</span>
										<span className="text-gt-gray-matter dark:text-foreground-muted">
											{formatDaysShort(s.day_pattern)} {formatTimeDisplay(s.start_time)}–
											{formatTimeDisplay(s.end_time)}
										</span>
										{s.location && (
											<>
												<span className="mx-2 text-gt-gray-matter">·</span>
												<span>{s.location}</span>
											</>
										)}
										<span className="ml-2 text-xs text-gt-gray-matter dark:text-foreground-muted">CRN: {s.crn}</span>
									</div>
									<Button
										size="sm"
										onClick={() => setAddToScheduleSectionId(s.id)}
										aria-label={`Add section ${s.section_code} to schedule`}
									>
										Add to schedule
									</Button>
								</div>
								<SectionReviewsBlock sectionId={s.id} sectionCode={s.section_code} />
							</motion.li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-8 rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6 dark:border-gt-gray-matter dark:bg-surface" aria-labelledby="reviews-heading">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 id="reviews-heading" className="text-lg font-semibold">
						Reviews
					</h2>
					<Button
						size="sm"
						onClick={() => setCourseReviewDialogOpen(true)}
						aria-label="Add course review"
					>
						Add review
					</Button>
				</div>
				<div className="mt-3">
					{courseReviewsLoading ? (
						<p className="text-sm text-gt-gray-matter dark:text-foreground-muted">
							Loading course reviews…
						</p>
					) : courseReviews && courseReviews.length > 0 ? (
						<>
							<p className="text-sm text-gt-gray-matter dark:text-foreground-muted">
								Course summary: {(
									courseReviews.reduce((a, r) => a + r.rating, 0) / courseReviews.length
								).toFixed(1)}
								/5 rating ·{' '}
								{(
									courseReviews.reduce((a, r) => a + r.difficulty, 0) / courseReviews.length
								).toFixed(1)}
								/5 difficulty ({courseReviews.length} review
								{courseReviews.length === 1 ? '' : 's'})
							</p>
							<ul className="mt-2 space-y-2">
								{courseReviews.map((r) => (
									<li
										key={r.id}
										className="rounded border border-gt-pi-mile p-3 dark:border-gt-gray-matter"
									>
										<div className="text-sm">
											Rating: {r.rating}/5 · Difficulty: {r.difficulty}/5
										</div>
										{r.comment && (
											<p className="mt-1 text-gt-gray-matter dark:text-foreground-muted">
												{r.comment}
											</p>
										)}
									</li>
								))}
							</ul>
						</>
					) : (
						<p className="text-sm text-gt-gray-matter dark:text-foreground-muted">
							No course reviews yet. Add one above.
						</p>
					)}
				</div>
				<CourseReviewDialog
					open={courseReviewDialogOpen}
					onOpenChange={setCourseReviewDialogOpen}
					courseId={id}
					onSuccess={refetchCourseReviews}
				/>
			</section>
			</div>

			<AddToScheduleDialog
				open={!!addToScheduleSectionId}
				onOpenChange={(open) => !open && setAddToScheduleSectionId(null)}
				sectionId={addToScheduleSectionId ?? ''}
			/>
		</div>
	)
}
