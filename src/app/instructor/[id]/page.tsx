'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/page-header'
import {
	useInstructor,
	useInstructorReviews,
	useCreateInstructorReview,
} from '@/hooks'
import { useSectionsByInstructor } from '@/hooks/use-sections'
import {
	InstructorProfilePanel,
	InstructorReviewCard,
	ReviewsRatingFilter,
} from '@/components/reviews'
import { DataPagination } from '@/components/ui/data-pagination'
import { TabNavLink } from '@/components/tabs/tab-nav-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'
import {
	getReturnNavLabel,
	getReturnPathFromSearchParams,
	withReturnTo,
} from '@/lib/return-navigation'
import { buildRmpProfessorUrl } from '@/utils/instructor-rmp'
import { useOpenTabs } from '@/context/open-tabs-provider'

const RMP_REVIEW_PAGE_SIZE = 10

export default function InstructorDetailPage() {
	const params = useParams()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const id = params?.id as string
	const parentPath = getReturnPathFromSearchParams(searchParams, '/dashboard')
	const backLabel = getReturnNavLabel(parentPath)
	const { data: instructor, error: instructorError, isLoading: instructorLoading } =
		useInstructor(id)
	const { updateTabLabel } = useOpenTabs()
	const { data: sections, isLoading: sectionsLoading } = useSectionsByInstructor(id)
	const { data: studentReviews, isLoading: studentReviewsLoading } =
		useInstructorReviews(id, { source: 'student' })
	const { data: rmpReviews, isLoading: rmpReviewsLoading } =
		useInstructorReviews(id, { source: 'rmp' })
	const { create, isLoading: submittingReview } = useCreateInstructorReview(id)
	const [rating, setRating] = useState(3)
	const [comment, setComment] = useState('')
	const [rmpRatingFilter, setRmpRatingFilter] = useState('all')
	const [rmpPage, setRmpPage] = useState(0)

	const filteredRmpReviews = useMemo(() => {
		if (rmpRatingFilter === 'all') return rmpReviews
		const target = parseInt(rmpRatingFilter, 10)
		return rmpReviews.filter((review) => review.rating === target)
	}, [rmpReviews, rmpRatingFilter])

	const paginatedRmpReviews = useMemo(() => {
		const start = rmpPage * RMP_REVIEW_PAGE_SIZE
		return filteredRmpReviews.slice(start, start + RMP_REVIEW_PAGE_SIZE)
	}, [filteredRmpReviews, rmpPage])

	useEffect(() => {
		setRmpPage(0)
	}, [rmpRatingFilter])

	useEffect(() => {
		if (!instructor?.name || !pathname) return
		updateTabLabel(pathname, instructor.name)
	}, [instructor?.name, pathname, updateTabLabel])

	const subtitle = useMemo(() => {
		const parts = [`Department: ${instructor?.department ?? ''}`]
		if (instructor?.rmp_quality != null) {
			parts.push(`RMP quality: ${Number(instructor.rmp_quality).toFixed(1)}/5`)
		}
		return parts.join(' · ')
	}, [instructor])

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault()
		await create(rating, comment || null)
		setRating(3)
		setComment('')
	}

	if (instructorLoading || sectionsLoading || !id) {
		return (
			<div className="min-h-screen bg-gt-white dark:bg-background">
				<PageHeader
					title=""
					subtitle=""
					backHref={parentPath}
					backLabel={backLabel}
					homeHref="/"
				/>
				<div className="max-w-7xl mx-auto px-6 py-8">
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		)
	}
	if (instructorError || !instructor) {
		return (
			<div className="p-6">
				<p className="text-red-600" role="alert">
					{instructorError?.message ?? 'Instructor not found'}
				</p>
			</div>
		)
	}
	if (sections.length === 0) {
		return (
			<div className="min-h-screen bg-gt-white dark:bg-background">
				<PageHeader
					title="Instructor not available"
					subtitle="Not on the current Georgia Tech course schedule"
					backHref={parentPath}
					backLabel={backLabel}
					homeHref="/"
				/>
				<div className="max-w-7xl mx-auto px-6 py-8">
					<p className="text-gt-gray-matter dark:text-foreground-muted" role="status">
						TechPlan only lists instructors who appear on the official
						Georgia Tech course schedule. This profile is not linked to
						any active sections in the selected terms.
					</p>
				</div>
			</div>
		)
	}

	const rmpProfileUrl = buildRmpProfessorUrl(instructor.rmp_professor_id)

	return (
		<div className="min-h-screen bg-gt-white dark:bg-background">
			<PageHeader
				title={instructor.name}
				subtitle={subtitle}
				backHref={parentPath}
				backLabel={backLabel}
				homeHref="/"
			/>
			<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
				{instructor.teaching_style && (
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
						<p className="text-gt-gray-matter dark:text-foreground-muted">
							{instructor.teaching_style}
						</p>
					</div>
				)}

				<InstructorProfilePanel
					instructor={instructor}
					sectionCount={sections.length}
				/>

				<section aria-labelledby="sections-heading">
					<h2
						id="sections-heading"
						className="text-xl font-bold text-gt-navy dark:text-foreground"
					>
						Sections
					</h2>
					{sectionsLoading ? (
						<p className="mt-4 text-sm text-gt-gray-matter">Loading…</p>
					) : (
						<ul className="mt-4 space-y-3">
							{sections.map((s, i) => (
								<motion.li
									key={s.id}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2, delay: i * 0.04 }}
									className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-3 dark:border-gt-gray-matter dark:bg-surface"
								>
									<TabNavLink
										href={withReturnTo(`/course/${s.course_id}`, pathname)}
										newTabLabel="Class Information"
										tabLabel={
											s.course
												? `${s.course.department} ${s.course.course_number}`
												: 'Course'
										}
										className="font-medium text-gt-navy underline hover:text-gt-bold-blue dark:text-foreground dark:hover:text-link-hover"
									>
										{s.course?.department} {s.course?.course_number}{' '}
										{s.course?.course_name}
									</TabNavLink>
									<span className="ml-2 text-gt-gray-matter dark:text-foreground-muted">
										Section {s.section_code} · {formatDaysShort(s.day_pattern)}{' '}
										{formatTimeDisplay(s.start_time)}–
										{formatTimeDisplay(s.end_time)}
									</span>
								</motion.li>
							))}
						</ul>
					)}
				</section>

				<section
					className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6 dark:border-gt-gray-matter dark:bg-surface"
					aria-labelledby="reviews-heading"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 id="reviews-heading" className="text-lg font-semibold">
								Reviews
							</h2>
							<p className="mt-1 text-sm text-gt-gray-matter dark:text-foreground-muted">
								Rate My Professors reviews sync from{' '}
								<a
									href="https://www.ratemyprofessors.com/search/professors/361?q=*"
									target="_blank"
									rel="noopener noreferrer"
									className="underline"
								>
									Georgia Tech on RMP
								</a>
								. Course-specific reviews also appear on matching course
								pages.
							</p>
						</div>
						{rmpProfileUrl && (
							<a
								href={rmpProfileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm font-medium text-gt-navy underline hover:text-gt-bold-blue dark:text-link"
							>
								Open RMP profile
							</a>
						)}
					</div>

					<div className="mt-4 space-y-6">
						<div aria-labelledby="rmp-reviews-heading">
							<h3
								id="rmp-reviews-heading"
								className="text-base font-semibold text-gt-navy dark:text-foreground"
							>
								Rate My Professors
								{rmpReviews.length > 0 && (
									<span className="ml-2 text-sm font-normal text-gt-gray-matter dark:text-foreground-muted">
										({rmpReviews.length} synced)
									</span>
								)}
							</h3>
							{rmpReviews.length > 0 && (
								<ReviewsRatingFilter
									value={rmpRatingFilter}
									onChange={setRmpRatingFilter}
									totalCount={filteredRmpReviews.length}
								/>
							)}
							{rmpReviewsLoading ? (
								<p className="mt-2 text-sm text-gt-gray-matter">Loading…</p>
							) : rmpReviews.length === 0 ? (
								<p className="mt-2 text-sm text-gt-gray-matter">
									{instructor.rmp_synced_at
										? 'No Rate My Professors profile is linked for this instructor yet.'
										: 'RMP reviews have not been synced yet. They appear automatically after the daily RMP sync runs.'}
								</p>
							) : filteredRmpReviews.length === 0 ? (
								<p className="mt-2 text-sm text-gt-gray-matter">
									No reviews match the selected rating filter.
								</p>
							) : (
								<>
									<ul className="mt-2 space-y-2">
										{paginatedRmpReviews.map((r) => (
											<InstructorReviewCard
												key={r.id}
												review={r}
												instructorName={instructor.name}
											/>
										))}
									</ul>
									{filteredRmpReviews.length > RMP_REVIEW_PAGE_SIZE && (
										<DataPagination
											page={rmpPage}
											totalCount={filteredRmpReviews.length}
											pageSize={RMP_REVIEW_PAGE_SIZE}
											onPageChange={setRmpPage}
											ariaLabel="Rate My Professors reviews pagination"
										/>
									)}
								</>
							)}
						</div>

						<div aria-labelledby="student-reviews-heading">
							<h3
								id="student-reviews-heading"
								className="text-base font-semibold text-gt-navy dark:text-foreground"
							>
								TechPlan student reviews
							</h3>
							{studentReviewsLoading ? (
								<p className="mt-2 text-sm text-gt-gray-matter">Loading…</p>
							) : studentReviews.length === 0 ? (
								<p className="mt-2 text-sm text-gt-gray-matter">
									No student reviews yet.
								</p>
							) : (
								<ul className="mt-2 space-y-2">
									{studentReviews.map((r) => (
										<InstructorReviewCard
											key={r.id}
											review={r}
											showCourseContext={false}
										/>
									))}
								</ul>
							)}
						</div>

						<form
							onSubmit={handleSubmitReview}
							className="grid max-w-md gap-2 rounded-lg border border-gt-pi-mile p-4 dark:border-gt-gray-matter"
						>
							<h3 className="font-medium">Submit a TechPlan review</h3>
							<div>
								<Label htmlFor="rating">Rating (1-5)</Label>
								<Input
									id="rating"
									type="number"
									min={1}
									max={5}
									value={rating}
									onChange={(e) =>
										setRating(parseInt(e.target.value, 10) || 3)
									}
								/>
							</div>
							<div>
								<Label htmlFor="comment">Comment</Label>
								<Textarea
									id="comment"
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									rows={3}
								/>
							</div>
							<Button type="submit" disabled={submittingReview}>
								Submit review
							</Button>
						</form>
					</div>
				</section>
			</div>
		</div>
	)
}
