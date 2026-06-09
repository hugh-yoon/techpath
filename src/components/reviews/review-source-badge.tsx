import type { ReviewSource } from '@/types'

interface ReviewSourceBadgeProps {
	source?: ReviewSource
}

export function ReviewSourceBadge({ source }: ReviewSourceBadgeProps) {
	if (source === 'rmp') {
		return (
			<span className="inline-flex rounded bg-gt-navy/10 px-1.5 py-0.5 text-xs font-medium text-gt-navy dark:bg-gt-gray-matter dark:text-foreground">
				Rate My Professors
			</span>
		)
	}
	return (
		<span className="inline-flex rounded bg-gt-tech-gold/25 px-1.5 py-0.5 text-xs font-medium text-gt-navy">
			TechPlan student
		</span>
	)
}
