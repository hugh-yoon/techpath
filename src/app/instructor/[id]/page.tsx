'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BackLink } from '@/components/ui/back-link'
import { PageHeader } from '@/components/ui/page-header'
import { useInstructor, useInstructorReviews, useCreateInstructorReview } from '@/hooks'
import { useSectionsByInstructor } from '@/hooks/use-sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'

export default function InstructorDetailPage() {
	const params = useParams()
	const id = params?.id as string
	const { data: instructor, error: instructorError, isLoading: instructorLoading } = useInstructor(id)
	const { data: sections, isLoading: sectionsLoading } = useSectionsByInstructor(id)
	const [showReviews, setShowReviews] = useState(false)
	const { data: reviews } = useInstructorReviews(showReviews ? id : null)
	const { create, isLoading: submittingReview } = useCreateInstructorReview(id)
	const [rating, setRating] = useState(3)
	const [comment, setComment] = useState('')

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault()
		await create(rating, comment || null)
		setRating(3)
		setComment('')
	}

	if (instructorLoading || !id) {
		return (
			<div className="min-h-screen bg-gt-white dark:bg-background">
				<PageHeader title="" subtitle="" homeHref="/" />
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
						<Skeleton className="h-4 w-full max-w-md" />
						<Skeleton className="mt-2 h-4 w-2/3" />
					</div>
					<section className="mt-8">
						<Skeleton className="h-6 w-24" />
						<div className="mt-4 space-y-3">
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-3 dark:border-gt-gray-matter dark:bg-surface"
								>
									<Skeleton className="h-4 w-36" />
									<Skeleton className="mt-1.5 h-3 w-48" />
								</div>
							))}
						</div>
					</section>
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

	return (
		<div className="min-h-screen bg-gt-white dark:bg-background">
			<PageHeader
				title={instructor.name}
				subtitle={`Department: ${instructor.department}${instructor.rating != null ? ` · Rating: ${instructor.rating}/5` : ''}`}
				homeHref="/"
			>
				<BackLink href="/dashboard" className="text-gt-tech-gold/90 hover:text-gt-tech-gold">
					Search
				</BackLink>
			</PageHeader>
			<div className="max-w-7xl mx-auto px-6 py-8">
				{instructor.teaching_style && (
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
						<p className="text-gt-gray-matter dark:text-foreground-muted">
							{instructor.teaching_style}
						</p>
					</div>
				)}

			<section className="mt-8" aria-labelledby="sections-heading">
				<h2 id="sections-heading" className="text-xl font-bold text-gt-navy dark:text-foreground">
					Sections
				</h2>
				{sectionsLoading ? (
					<div className="mt-4 space-y-3" aria-hidden>
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-3 dark:border-gt-gray-matter dark:bg-surface"
							>
								<Skeleton className="h-4 w-36" />
								<Skeleton className="mt-1.5 h-3 w-48" />
							</div>
						))}
					</div>
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
								<Link
									href={`/course/${s.course_id}`}
									className="font-medium text-gt-navy underline hover:text-gt-bold-blue dark:text-foreground dark:hover:text-link-hover"
								>
									{s.course?.department} {s.course?.course_number}{' '}
									{s.course?.course_name}
								</Link>
								<span className="ml-2 text-gt-gray-matter dark:text-foreground-muted">
									Section {s.section_code} · {formatDaysShort(s.day_pattern)}{' '}
									{formatTimeDisplay(s.start_time)}–{formatTimeDisplay(s.end_time)}
								</span>
							</motion.li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-8 rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6 dark:border-gt-gray-matter dark:bg-surface" aria-labelledby="reviews-heading">
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
									<div className="text-sm">Rating: {r.rating}/5</div>
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
			</div>
		</div>
	)
}
