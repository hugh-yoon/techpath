'use client'

import { useMemo } from 'react'
import { Course, CourseRedFlag } from '@/types'
import { AlertBanner } from '../ui/alert-banner'
import { InfoPill } from '../ui/info-pill'
import { AlertTriangle } from 'lucide-react'

interface DiscoveryCardProps {
	course: Course & { cost?: string; gradeDistribution?: Record<string, number> }
	onAction?: (action: 'add' | 'skip' | 'details') => void
}

const sortRedFlags = (flags: CourseRedFlag[] | null | undefined) =>
	[...(flags ?? [])].sort((a, b) => a.sort_order - b.sort_order)

export function DiscoveryCard({ course, onAction }: DiscoveryCardProps) {
	const difficultyLabel =
		course.difficulty_rating != null ? `${course.difficulty_rating}/5` : '—'
	const redFlags = useMemo(() => sortRedFlags(course.course_red_flags), [course.course_red_flags])

	const deckBlurb = (() => {
		const s = course.deck_summary?.trim()
		if (s) return s.length > 140 ? `${s.slice(0, 137)}…` : s
		if (!course.description?.trim()) return null
		const d = course.description.trim()
		return d.length > 90 ? `${d.slice(0, 87)}…` : d
	})()

	const redFlagsDeck = redFlags.slice(0, 2)
	const redFlagsOverflow = redFlags.length - redFlagsDeck.length

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-2 border-gt-navy/10 bg-gradient-to-br from-gt-white to-gt-diploma shadow-lg">
			<div className="shrink-0 border-b border-gt-navy/10 bg-gt-navy px-3 py-2">
				<h3 className="text-base font-bold leading-tight text-gt-tech-gold">
					{course.department} {course.course_number}
				</h3>
				<p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gt-white/85">
					{course.course_name}
				</p>
			</div>

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
				{deckBlurb && (
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wide text-gt-gray-matter">
							At a glance
						</p>
						<p className="mt-0.5 line-clamp-3 text-xs leading-snug text-gt-navy">{deckBlurb}</p>
					</div>
				)}

				{redFlagsDeck.length > 0 && (
					<div
						className="rounded-md border border-red-200 bg-red-50/90 p-2"
						role="status"
						aria-label="Peer-reported cautions"
					>
						<div className="mb-1 flex items-center gap-1.5 text-red-800">
							<AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
							<span className="text-[10px] font-bold uppercase tracking-wide">
								Red flags
							</span>
						</div>
						<ul className="list-inside list-disc space-y-1 text-[11px] leading-snug text-red-900">
							{redFlagsDeck.map((f) => (
								<li key={f.id} className="line-clamp-2 [overflow-wrap:anywhere]">
									{f.body}
								</li>
							))}
						</ul>
						{redFlagsOverflow > 0 && (
							<p className="mt-1 text-[10px] font-medium text-red-800/90">
								+{redFlagsOverflow} more on Details
							</p>
						)}
					</div>
				)}

				{course.cost && <AlertBanner text={`${course.cost} Lab Kit Required`} />}

				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-md bg-gt-tech-gold/5 px-2 py-1.5">
						<div className="text-[10px] font-semibold uppercase tracking-wide text-gt-gray-matter">
							Credit hours
						</div>
						<div className="text-base font-bold leading-tight text-gt-navy">{course.credit_hours}</div>
					</div>
					<div className="rounded-md bg-gt-tech-gold/5 px-2 py-1.5">
						<div className="text-[10px] font-semibold uppercase tracking-wide text-gt-gray-matter">
							Difficulty
						</div>
						<div className="text-base font-bold leading-tight text-gt-navy">{difficultyLabel}</div>
					</div>
				</div>

				{course.gradeDistribution && (
					<div className="space-y-1">
						<div className="text-[10px] font-semibold uppercase tracking-wide text-gt-gray-matter">
							Grade distribution
						</div>
						<div className="flex max-h-14 flex-wrap gap-1 overflow-y-auto">
							{Object.entries(course.gradeDistribution).map(([grade, percentage]) => (
								<InfoPill key={grade} label={grade} value={`${percentage}%`} />
							))}
						</div>
					</div>
				)}
			</div>

			<div className="flex shrink-0 gap-1.5 border-t border-gt-navy/10 bg-gt-diploma p-2">
				<button
					type="button"
					onClick={() => onAction?.('skip')}
					className="flex-1 rounded-md border-2 border-gt-navy py-1.5 text-xs font-semibold text-gt-navy transition-colors hover:bg-gt-navy hover:text-gt-white"
				>
					Skip
				</button>
				<button
					type="button"
					onClick={() => onAction?.('details')}
					className="flex-1 rounded-md bg-gt-navy py-1.5 text-xs font-semibold text-gt-white transition-colors hover:bg-gt-navy/90"
				>
					Details
				</button>
				<button
					type="button"
					onClick={() => onAction?.('add')}
					className="flex-1 rounded-md bg-gt-tech-gold py-1.5 text-xs font-semibold text-gt-navy transition-colors hover:bg-gt-tech-medium-gold"
				>
					Add
				</button>
			</div>
		</div>
	)
}
