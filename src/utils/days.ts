import { DAYS_OF_WEEK } from './constants'
import type { DayOfWeek } from '@/types'

/**
 * Parse day_pattern from DB (array or comma-separated) to DayOfWeek[].
 */
export function parseDayPattern(
	value: string | string[] | null | undefined,
): DayOfWeek[] {
	if (value == null) return []
	if (Array.isArray(value)) {
		return value.filter((d): d is DayOfWeek =>
			DAYS_OF_WEEK.includes(d as DayOfWeek),
		)
	}
	return value
		.split(',')
		.map((d) => d.trim())
		.filter((d): d is DayOfWeek => DAYS_OF_WEEK.includes(d as DayOfWeek))
}

/**
 * Format day array for display e.g. "Mon, Wed, Fri".
 */
export function formatDaysShort(days: DayOfWeek[]): string {
	const short: Record<DayOfWeek, string> = {
		Monday: 'Mon',
		Tuesday: 'Tue',
		Wednesday: 'Wed',
		Thursday: 'Thu',
		Friday: 'Fri',
	}
	return days.map((d) => short[d]).join(', ')
}
