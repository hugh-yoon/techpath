const TITLE_PREFIXES = /^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s+/i

export function normalizeInstructorName(name: string): string {
	return name
		.trim()
		.replace(TITLE_PREFIXES, '')
		.replace(/\s+/g, ' ')
		.toLowerCase()
}

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
