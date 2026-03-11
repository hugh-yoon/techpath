'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BackLink } from '@/components/ui/back-link'
import { useCourse, useCourseReviews, useCreateCourseReview } from '@/hooks'
import { useSectionsByCourse } from '@/hooks/use-sections'
import { AddToScheduleDialog } from '@/components/course/add-to-schedule-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'

export default function CourseDetailPage() {
	const params = useParams()
	const id = params?.id as string
	const { data: course, error: courseError, isLoading: courseLoading } = useCourse(id)
	const { data: sections, isLoading: sectionsLoading } = useSectionsByCourse(id)
	const [showReviews, setShowReviews] = useState(false)
	const { data: reviews } = useCourseReviews(showReviews ? id : null)
	const { create, isLoading: submittingReview } = useCreateCourseReview(id)
	const [addToScheduleSectionId, setAddToScheduleSectionId] = useState<string | null>(null)
	const [rating, setRating] = useState(3)
	const [difficulty, setDifficulty] = useState(3)
	const [comment, setComment] = useState('')

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault()
		const ok = await create(rating, difficulty, comment || null)
		if (ok) {
			setRating(3)
			setDifficulty(3)
			setComment('')
		}
	}

	if (courseLoading || !id) {
		return (
			<div className="p-6">
				<p className="text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
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
		<div className="min-h-screen bg-gt-white p-6 dark:bg-background">
			<div className="mb-4">
				<BackLink href="/dashboard">Search</BackLink>
			</div>
			<div className="mt-4">
				<h1 className="text-2xl font-semibold">
					{course.department} {course.course_number}
				</h1>
				<p className="mt-1 text-lg text-gt-gray-matter dark:text-foreground-muted">
					{course.course_name}
				</p>
				<div className="mt-4 flex flex-wrap gap-4 text-sm">
					<span>Credit hours: {course.credit_hours}</span>
					{course.difficulty_rating != null && (
						<span>Difficulty: {course.difficulty_rating}/5</span>
					)}
				</div>
				{course.description && (
					<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">
						{course.description}
					</p>
				)}
			</div>

			<section className="mt-8" aria-labelledby="sections-heading">
				<h2 id="sections-heading" className="text-lg font-semibold">
					Sections
				</h2>
				{sectionsLoading ? (
					<p className="mt-2 text-gt-gray-matter dark:text-foreground-muted">Loading sections…</p>
				) : (
					<ul className="mt-2 space-y-3">
						{sections.map((s) => (
							<li
								key={s.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gt-pi-mile bg-gt-white p-3 dark:border-gt-gray-matter dark:bg-surface"
							>
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
									variant="outline"
									onClick={() => setAddToScheduleSectionId(s.id)}
									aria-label={`Add section ${s.section_code} to schedule`}
								>
									Add to schedule
								</Button>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-8" aria-labelledby="reviews-heading">
				<h2 id="reviews-heading" className="text-lg font-semibold">
					Reviews
				</h2>
				<Button
					variant="ghost"
					size="sm"
					className="mt-2"
					onClick={() => setShowReviews(true)}
				>
					{showReviews ? 'Hide reviews' : 'Load reviews'}
				</Button>
				{showReviews && (
					<>
						<ul className="mt-2 space-y-2">
							{reviews?.map((r) => (
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
						<form
							onSubmit={handleSubmitReview}
							className="mt-4 grid max-w-md gap-2 rounded-lg border border-gt-pi-mile p-4 dark:border-gt-gray-matter"
						>
							<h3 className="font-medium">Submit a review</h3>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<Label htmlFor="rating">Rating (1-5)</Label>
									<Input
										id="rating"
										type="number"
										min={1}
										max={5}
										value={rating}
										onChange={(e) => setRating(parseInt(e.target.value, 10) || 3)}
									/>
								</div>
								<div>
									<Label htmlFor="difficulty">Difficulty (1-5)</Label>
									<Input
										id="difficulty"
										type="number"
										min={1}
										max={5}
										value={difficulty}
										onChange={(e) =>
											setDifficulty(parseInt(e.target.value, 10) || 3)
										}
									/>
								</div>
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
					</>
				)}
			</section>

			<AddToScheduleDialog
				open={!!addToScheduleSectionId}
				onOpenChange={(open) => !open && setAddToScheduleSectionId(null)}
				sectionId={addToScheduleSectionId ?? ''}
			/>
		</div>
	)
}
