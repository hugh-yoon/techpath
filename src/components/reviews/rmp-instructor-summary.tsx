import type { Instructor } from '@/types'

interface RmpInstructorSummaryProps {
	instructor: Instructor
}

export function RmpInstructorSummary({ instructor }: RmpInstructorSummaryProps) {
	const hasRmp = instructor.rmp_professor_id != null
		|| instructor.rmp_quality != null

	if (!hasRmp) return null

	return (
		<div
			className="rounded-xl border border-gt-navy/15 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface"
			aria-label="Rate My Professors summary"
		>
			<p className="text-xs font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-foreground-muted">
				Rate My Professors
			</p>
			<div className="mt-2 flex flex-wrap gap-4 text-sm text-gt-navy dark:text-foreground">
				{instructor.rmp_quality != null && (
					<span>Quality: {Number(instructor.rmp_quality).toFixed(1)}/5</span>
				)}
				{instructor.rmp_difficulty != null && (
					<span>
						Difficulty: {Number(instructor.rmp_difficulty).toFixed(1)}/5
					</span>
				)}
				{instructor.rmp_would_take_again != null && (
					<span>
						Would take again:{' '}
						{Number(instructor.rmp_would_take_again).toFixed(0)}%
					</span>
				)}
				{instructor.rmp_rating_count != null && (
					<span>{instructor.rmp_rating_count} ratings</span>
				)}
			</div>
		</div>
	)
}
