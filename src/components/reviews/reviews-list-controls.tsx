'use client'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const RATING_OPTIONS = [
	{ value: 'all', label: 'All ratings' },
	{ value: '5', label: '5 stars' },
	{ value: '4', label: '4 stars' },
	{ value: '3', label: '3 stars' },
	{ value: '2', label: '2 stars' },
	{ value: '1', label: '1 star' },
]

interface ReviewsRatingFilterProps {
	value: string
	onChange: (value: string) => void
	totalCount: number
}

export function ReviewsRatingFilter({
	value,
	onChange,
	totalCount,
}: ReviewsRatingFilterProps) {
	return (
		<div className="mt-3 flex flex-wrap items-end gap-4">
			<div className="grid gap-1.5">
				<Label htmlFor="review-rating-filter">Filter by rating</Label>
				<Select value={value} onValueChange={onChange}>
					<SelectTrigger
						id="review-rating-filter"
						className="w-[160px]"
						aria-label="Filter reviews by rating"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{RATING_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<p
				className="text-sm text-gt-gray-matter dark:text-foreground-muted"
				aria-live="polite"
			>
				{totalCount} review{totalCount === 1 ? '' : 's'}
			</p>
		</div>
	)
}
