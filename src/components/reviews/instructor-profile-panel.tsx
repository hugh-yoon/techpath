import type { Instructor } from '@/types'
import {
	buildRmpProfessorUrl,
	hasRmpProfile,
	hasRmpSyncAttempt,
} from '@/utils/instructor-rmp'

interface InstructorProfilePanelProps {
	instructor: Instructor
	sectionCount?: number
}

export function InstructorProfilePanel({
	instructor,
	sectionCount,
}: InstructorProfilePanelProps) {
	const hasRmp = hasRmpProfile(instructor)
	const rmpChecked = hasRmpSyncAttempt(instructor)
	const rmpUrl = buildRmpProfessorUrl(instructor.rmp_professor_id)

	return (
		<div className="space-y-3">
			<div
				className="rounded-xl border border-gt-navy/15 bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface"
				aria-label="Georgia Tech schedule information"
			>
				<p className="text-xs font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-foreground-muted">
					Georgia Tech schedule
				</p>
				<p className="mt-2 text-sm text-gt-navy dark:text-foreground">
					{instructor.name} is listed from official Banner course schedule
					data on TechPlan. Only instructors assigned to active Georgia
					Tech sections appear here; RMP-only profiles are not included.
					{sectionCount != null && sectionCount > 0 && (
						<>
							{' '}
							Currently teaching {sectionCount} active section
							{sectionCount === 1 ? '' : 's'} in the selected terms.
						</>
					)}
				</p>
				<p className="mt-1 text-sm text-gt-gray-matter dark:text-foreground-muted">
					Department: {instructor.department}
				</p>
			</div>

			{hasRmp ? (
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
					{rmpUrl && (
						<a
							href={rmpUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 inline-block text-sm font-medium text-gt-navy underline hover:text-gt-bold-blue dark:text-link"
						>
							View profile on Rate My Professors
						</a>
					)}
				</div>
			) : (
				<div
					className="rounded-xl border border-gt-navy/10 bg-gt-white p-4 dark:border-gt-gray-matter dark:bg-surface"
					aria-label="Rate My Professors status"
				>
					<p className="text-xs font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-foreground-muted">
						Rate My Professors
					</p>
					<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
						{rmpChecked
							? 'No Rate My Professors profile is linked for this instructor. They still appear on TechPlan whenever they are assigned to a section in the Georgia Tech schedule.'
							: 'RMP ratings have not been checked yet. Schedule and section information above comes from Georgia Tech Banner and does not require an RMP profile.'}
					</p>
				</div>
			)}
		</div>
	)
}

interface InstructorRmpBadgeProps {
	instructor?: Pick<
		Instructor,
		'rmp_quality' | 'rmp_professor_id' | 'rmp_rating_count'
	> | null
}

/** Optional inline RMP quality — never replaces the instructor name. */
export function InstructorRmpBadge({ instructor }: InstructorRmpBadgeProps) {
	if (!instructor || !hasRmpProfile(instructor) || instructor.rmp_quality == null) {
		return null
	}

	return (
		<span className="ml-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
			(RMP {Number(instructor.rmp_quality).toFixed(1)}/5)
		</span>
	)
}
