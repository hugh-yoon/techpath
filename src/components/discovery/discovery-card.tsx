'use client'

import { Course } from '@/types'
import { AlertBanner } from '../ui/alert-banner'
import { InfoPill } from '../ui/info-pill'
import { Star } from 'lucide-react'

interface DiscoveryCardProps {
	course: Course & { cost?: string; gradeDistribution?: Record<string, number> }
	onAction?: (action: 'add' | 'skip' | 'details') => void
}

export function DiscoveryCard({ course, onAction }: DiscoveryCardProps) {
	const avgRating = course.difficulty_rating ? course.difficulty_rating.toFixed(1) : 'N/A'
	
	return (
		<div className="flex h-full flex-col rounded-2xl bg-gradient-to-br from-gt-white to-gt-diploma border-2 border-gt-navy/10 shadow-lg overflow-hidden">
			{/* Header */}
			<div className="border-b border-gt-navy/10 bg-gt-navy px-6 py-4">
				<h3 className="text-lg font-bold text-gt-tech-gold">
					{course.department} {course.course_number}
				</h3>
				<p className="mt-1 text-sm text-gt-white/80">{course.course_name}</p>
			</div>

			{/* Content */}
		<div className="flex-1 overflow-y-auto space-y-4 p-6">
			{/* Description */}
			<p className="text-sm text-gt-gray-matter">
				</p>

				{/* Alert Banner for Cost */}
				{course.cost && <AlertBanner text={`${course.cost} Lab Kit Required`} />}

				{/* Quick Stats */}
				<div className="grid grid-cols-2 gap-3">
					<div className="rounded-lg bg-gt-tech-gold/5 p-3">
						<div className="text-xs font-semibold text-gt-gray-matter uppercase tracking-wide">
							Credits
						</div>
						<div className="mt-1 text-lg font-bold text-gt-navy">{course.credit_hours}</div>
					</div>
					<div className="rounded-lg bg-gt-tech-gold/5 p-3">
						<div className="text-xs font-semibold text-gt-gray-matter uppercase tracking-wide">
							Difficulty
						</div>
						<div className="flex items-center gap-1 mt-1">
							<Star className="h-4 w-4 fill-gt-tech-gold text-gt-tech-gold" />
							<span className="text-lg font-bold text-gt-navy">{avgRating}</span>
						</div>
					</div>
				</div>

				{/* Grade Distribution Pills */}
				{course.gradeDistribution && (
					<div className="space-y-2">
						<div className="text-xs font-semibold text-gt-gray-matter uppercase tracking-wide">
							Grade Distribution
						</div>
						<div className="flex flex-wrap gap-2">
							{Object.entries(course.gradeDistribution).map(([grade, percentage]) => (
								<InfoPill key={grade} label={grade} value={`${percentage}%`} />
							))}
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="border-t border-gt-navy/10 flex gap-2 bg-gt-diploma p-4">
				<button
					onClick={() => onAction?.('skip')}
					className="flex-1 rounded-lg border-2 border-gt-navy text-gt-navy font-semibold py-2 transition-colors hover:bg-gt-navy hover:text-gt-white"
				>
					Skip
				</button>
				<button
					onClick={() => onAction?.('details')}
					className="flex-1 rounded-lg bg-gt-navy text-gt-white font-semibold py-2 transition-colors hover:bg-gt-navy/90"
				>
					Details
				</button>
				<button
					onClick={() => onAction?.('add')}
					className="flex-1 rounded-lg bg-gt-tech-gold text-gt-navy font-semibold py-2 transition-colors hover:bg-gt-tech-medium-gold"
				>
					Add
				</button>
			</div>
		</div>
	)
}
