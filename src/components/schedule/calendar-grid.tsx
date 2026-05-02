'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CALENDAR_TOTAL_ROWS } from '@/utils/constants'
import { getBlockRowSpan, timeToRowIndex, formatTimeDisplay } from '@/utils/time'
import { cn } from '@/lib/utils'
import { withReturnTo } from '@/lib/return-navigation'
import type { SectionWithRelations } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
const ROW_HEIGHT = 28
const TIME_COLUMN_WIDTH = 48

interface CalendarGridProps {
	sections: Array<{ section: SectionWithRelations }>
}

export function CalendarGrid({ sections }: CalendarGridProps) {
	const pathname = usePathname()
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
		<div
			className="flex flex-1 flex-col overflow-auto rounded-lg border border-gt-pi-mile bg-gt-white dark:border-gt-gray-matter dark:bg-surface"
			style={{ minWidth: 0 }}
		>
			{/* Header: one grid so vertical lines align with body */}
			<div
				className="grid shrink-0 text-sm"
				style={{
					gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(5, minmax(0, 1fr))`,
				}}
			>
				<div className="border-b border-r border-gt-pi-mile p-1 dark:border-gt-gray-matter" />
				{DAYS.map((d) => (
					<div
						key={d}
						className="border-b border-r border-gt-pi-mile p-2 font-medium text-gt-navy last:border-r-0 dark:border-gt-gray-matter"
					>
						{d.slice(0, 3)}
					</div>
				))}
			</div>
			{/* Body: same column template so time column and day columns align */}
			<div
				className="grid min-h-0 flex-1"
				style={{
					gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(5, minmax(0, 1fr))`,
					height: CALENDAR_TOTAL_ROWS * ROW_HEIGHT,
				}}
			>
				{/* Time column: fixed width, horizontal lines and alternating row background */}
				<div className="flex flex-col border-r border-gt-pi-mile dark:border-gt-gray-matter">
					{timeLabels.map((time, i) => (
						<div
							key={time}
							className={cn(
								'flex shrink-0 items-center justify-end border-b border-gt-pi-mile pr-1.5 text-right text-xs font-medium text-gt-navy dark:border-gt-gray-matter dark:text-foreground',
								i % 2 === 0
									? 'bg-gt-white dark:bg-surface'
									: 'bg-gt-pi-mile/25 dark:bg-gt-gray-matter/15',
							)}
							style={{ height: ROW_HEIGHT }}
						>
							{i % 4 === 0 ? formatTimeDisplay(time) : null}
						</div>
					))}
				</div>
				{/* Day columns: horizontal lines extend across each row, vertical borders, blocks on top */}
				{DAYS.map((day, dayIndex) => (
					<div
						key={day}
						className="relative border-r border-gt-pi-mile last:border-r-0 dark:border-gt-gray-matter"
					>
						{/* Full-width horizontal grid lines and alternating row background */}
						{Array.from({ length: CALENDAR_TOTAL_ROWS }).map((_, i) => (
							<div
								key={i}
								className={cn(
									'absolute left-0 right-0 border-b border-gt-pi-mile dark:border-gt-gray-matter',
									i % 2 === 0
										? 'bg-gt-white dark:bg-surface'
										: 'bg-gt-pi-mile/25 dark:bg-gt-gray-matter/15',
								)}
								style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
								aria-hidden
							/>
						))}
						{/* Course blocks: extra padding so text stays on one line */}
						{blocksByDay[dayIndex].map(({ section, startRow, span }) => (
							<Link
								key={section.id}
								href={withReturnTo(`/course/${section.course_id}`, pathname)}
								target="_blank"
								rel="noopener noreferrer"
								className="absolute left-1 right-1 flex flex-col justify-center rounded bg-gt-tech-gold/20 py-1.5 px-2 text-xs font-medium text-gt-navy hover:bg-gt-tech-gold/35 dark:bg-gt-tech-gold/25 dark:text-gt-navy dark:hover:bg-gt-tech-gold/40"
								style={{
									top: startRow * ROW_HEIGHT + 2,
									height: span * ROW_HEIGHT - 4,
									minHeight: 32,
								}}
								aria-label={`${section.course?.department} ${section.course?.course_number} ${section.section_code} – open course`}
							>
								<span className="truncate font-medium">
									{section.course?.department} {section.course?.course_number}
								</span>
								<span className="truncate text-[11px]">
									{section.section_code} {section.instructor?.name ?? ''}
								</span>
							</Link>
						))}
					</div>
				))}
			</div>
		</div>
	)
}
