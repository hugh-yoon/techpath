'use client'

import Link from 'next/link'
import { CALENDAR_TOTAL_ROWS } from '@/utils/constants'
import { getBlockRowSpan, timeToRowIndex, formatTimeDisplay } from '@/utils/time'
import type { SectionWithRelations } from '@/types'
import { formatDaysShort } from '@/utils/days'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

interface CalendarGridProps {
	sections: Array<{ section: SectionWithRelations }>
}

export function CalendarGrid({ sections }: CalendarGridProps) {
	const timeLabels = Array.from({ length: CALENDAR_TOTAL_ROWS }, (_, i) => {
		const hour = 7 + Math.floor(i / 4)
		const min = (i % 4) * 15
		return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
	})

	const blocksByDay = DAYS.map((day) => {
		return sections
			.filter(({ section }) => section.day_pattern.includes(day))
			.map(({ section }) => {
				const startRow = timeToRowIndex(section.start_time)
				const span = getBlockRowSpan(section.start_time, section.end_time)
				return { section, startRow, span }
			})
	})

	return (
		<div className="flex flex-1 flex-col overflow-auto rounded-lg border border-gt-pi-mile bg-gt-white dark:border-gt-gray-matter dark:bg-surface">
			<div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr] text-sm">
				<div className="border-b border-r border-gt-pi-mile p-1 dark:border-gt-gray-matter" />
				{DAYS.map((d) => (
					<div
						key={d}
						className="border-b border-r border-gt-pi-mile p-2 font-medium text-gt-navy"
					>
						{d.slice(0, 3)}
					</div>
				))}
			</div>
			<div
				className="relative flex flex-1"
				style={{ minHeight: CALENDAR_TOTAL_ROWS * 24 }}
			>
				<div className="flex flex-col shrink-0">
					{timeLabels.map((time, i) => (
						<div
							key={time}
							className="h-6 shrink-0 border-b border-gt-pi-mile pr-1 text-right text-xs text-gt-gray-matter dark:border-gt-gray-matter dark:text-gt-pi-mile"
							style={{ height: 24 }}
						>
							{i % 4 === 0 ? formatTimeDisplay(time) : ''}
						</div>
					))}
				</div>
				<div
					className="relative grid flex-1 grid-cols-5"
					style={{ height: CALENDAR_TOTAL_ROWS * 24 }}
				>
					{DAYS.map((day, dayIndex) => (
						<div
							key={day}
							className="relative border-r border-gt-pi-mile last:border-r-0 dark:border-gt-gray-matter"
						>
							{blocksByDay[dayIndex].map(({ section, startRow, span }) => (
								<Link
									key={section.id}
									href={`/course/${section.course_id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="absolute left-0.5 right-0.5 rounded bg-gt-tech-gold/20 py-0.5 px-1 text-xs font-medium text-gt-navy hover:bg-gt-tech-gold/35 dark:bg-gt-tech-gold/25 dark:text-gt-navy dark:hover:bg-gt-tech-gold/40"
									style={{
										top: `${(startRow / CALENDAR_TOTAL_ROWS) * 100}%`,
										height: `${(span / CALENDAR_TOTAL_ROWS) * 100}%`,
										minHeight: 20,
									}}
									aria-label={`${section.course?.department} ${section.course?.course_number} ${section.section_code} – open course`}
								>
									<span className="font-medium">
										{section.course?.department} {section.course?.course_number}
									</span>
									<span className="block truncate">
										{section.section_code} {section.instructor?.name ?? ''}
									</span>
								</Link>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
