export { normalizeInstructorName } from './matching/person-name.ts'

export function mapBannerSemester(description: string): 'Fall' | 'Spring' | 'Summer' | null {
	const lower = description.toLowerCase()
	if (lower.includes('fall')) return 'Fall'
	if (lower.includes('spring')) return 'Spring'
	if (lower.includes('summer')) return 'Summer'
	return null
}

export function snapTimeToFifteenMinutes(time: string): string {
	const [hours, minutes] = time.split(':').map(Number)
	const total = hours * 60 + minutes
	const snapped = Math.round(total / 15) * 15
	const h = Math.floor(snapped / 60)
	const m = snapped % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

const MIN_SECTION_TIME = '07:00:00'
const MAX_SECTION_TIME = '21:00:00'

/** Banner uses values like 1301R for recitation rows — store the numeric prefix. */
export function parseBannerCourseNumber(raw: unknown): number | null {
	const text = String(raw ?? '').trim()
	const match = text.match(/^(\d+)/)
	if (!match) return null
	const value = Number(match[1])
	return Number.isFinite(value) ? value : null
}

export function clampBannerSectionTimes(
	startTime: string,
	endTime: string,
): { startTime: string; endTime: string } | null {
	let start = snapTimeToFifteenMinutes(startTime)
	let end = snapTimeToFifteenMinutes(endTime)
	if (start < MIN_SECTION_TIME) start = MIN_SECTION_TIME
	if (end > MAX_SECTION_TIME) end = MAX_SECTION_TIME
	if (start >= end) return null
	return { startTime: start, endTime: end }
}
