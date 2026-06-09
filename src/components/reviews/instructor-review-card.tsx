import type { InstructorReview } from '@/types'
import { ReviewSourceBadge } from './review-source-badge'

interface InstructorReviewCardProps {
	review: InstructorReview
	instructorName?: string | null
	showCourseContext?: boolean
}

export function InstructorReviewCard({
	review,
	instructorName,
	showCourseContext = true,
}: InstructorReviewCardProps) {
	const isRmp = review.source === 'rmp'

	return (
		<li className="rounded border border-gt-pi-mile p-3 dark:border-gt-gray-matter">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<ReviewSourceBadge source={review.source} />
				<span>Rating: {review.rating}/5</span>
				{review.difficulty != null && (
					<span>· Difficulty: {Number(review.difficulty)}/5</span>
				)}
				{review.would_take_again != null && (
					<span>
						· Would take again: {review.would_take_again ? 'Yes' : 'No'}
					</span>
				)}
			</div>
			{showCourseContext && review.course_context && (
				<p className="mt-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
					{isRmp && instructorName
						? `${instructorName} · ${review.course_context}`
						: `Course: ${review.course_context}`}
				</p>
			)}
			{review.comment && (
				<p className="mt-2 text-gt-gray-matter dark:text-foreground-muted">
					{review.comment}
				</p>
			)}
		</li>
	)
}
