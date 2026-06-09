/** Normalize dept + number for matching RMP course_context strings. */
export function normalizeCourseCode(
	department: string,
	courseNumber: number,
): string {
	return `${department}${courseNumber}`.toUpperCase().replace(/\s/g, '')
}

/**
 * RMP uses values like "CS4510", "CS 4510", "CS-4510".
 */
export function courseContextMatchesCourse(
	courseContext: string | null | undefined,
	department: string,
	courseNumber: number,
): boolean {
	if (!courseContext?.trim()) return false
	const target = normalizeCourseCode(department, courseNumber)
	const normalized = courseContext.toUpperCase().replace(/[\s\-_]/g, '')
	return normalized === target || normalized.includes(target)
}
