/**
 * Normalize time from DB (HH:mm:ss or HH:mm) to HH:mm for app use.
 */
export function normalizeTime(value: string | null | undefined): string {
	if (value == null || value === '') return '07:00'
	const part = value.slice(0, 5)
	return /^\d{2}:\d{2}$/.test(part) ? part : '07:00'
}
