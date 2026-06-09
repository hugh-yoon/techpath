import type { ReviewSource } from '@/types'

interface ReviewSourceBadgeProps {
	source?: ReviewSource
}

export function ReviewSourceBadge({ source }: ReviewSourceBadgeProps) {
	if (source === 'rmp') {
		return (
			<span className="inline-flex rounded bg-gt-navy px-1.5 py-0.5 text-xs font-medium text-gt-tech-gold">
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
