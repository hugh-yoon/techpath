import {
	CALENDAR_END_HOUR,
	CALENDAR_START_HOUR,
	CALENDAR_SLOT_MINUTES,
	CALENDAR_TOTAL_ROWS,
} from './constants'

const SLOTS_PER_HOUR = 60 / CALENDAR_SLOT_MINUTES

/**
 * Generate all valid 15-minute time slots from 7:00 AM to 9:00 PM.
 * Returns strings in "HH:mm" format (24h).
 */
export function getTimeSlots(): string[] {
	const slots: string[] = []
	for (let h = CALENDAR_START_HOUR; h < CALENDAR_END_HOUR; h++) {
		for (let m = 0; m < 60; m += CALENDAR_SLOT_MINUTES) {
			slots.push(
				`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
			)
		}
	}
	return slots
}

/**
 * Parse "HH:mm" (24h) to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number)
	return h * 60 + m
}

/**
 * Minutes since midnight to "HH:mm" (24h).
 */
export function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Format "HH:mm" (24h) to display string e.g. "7:00 AM", "1:30 PM".
 */
export function formatTimeDisplay(time: string): string {
	const [hStr, mStr] = time.split(':')
	const h = parseInt(hStr, 10)
	const m = parseInt(mStr, 10)
	if (h === 0) return `12:${mStr} AM`
	if (h < 12) return `${h}:${mStr} AM`
	if (h === 12) return `12:${mStr} PM`
	return `${h - 12}:${mStr} PM`
}

/**
 * Get the calendar row index (0-based) for a given "HH:mm" time.
 * Row 0 = 7:00 AM, row 55 = 8:45 PM.
 */
export function timeToRowIndex(time: string): number {
	const minutes = timeToMinutes(time)
	const startMinutes = CALENDAR_START_HOUR * 60
	return Math.floor((minutes - startMinutes) / CALENDAR_SLOT_MINUTES)
}

/**
 * Get the number of rows (slot count) a block should span for start_time to end_time.
 */
export function getBlockRowSpan(startTime: string, endTime: string): number {
	const startRow = timeToRowIndex(startTime)
	const endRow = timeToRowIndex(endTime)
	return Math.max(1, endRow - startRow)
}

/**
 * Validate time is within 7:00 AM - 9:00 PM and on a 15-minute boundary.
 */
export function isValidTimeSlot(time: string): boolean {
	const minutes = timeToMinutes(time)
	const startMinutes = CALENDAR_START_HOUR * 60
	const endMinutes = CALENDAR_END_HOUR * 60
	if (minutes < startMinutes || minutes >= endMinutes) return false
	return minutes % CALENDAR_SLOT_MINUTES === 0
}

export { CALENDAR_TOTAL_ROWS }
