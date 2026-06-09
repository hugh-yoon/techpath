import { departmentsEquivalent, normalizeDepartmentCode } from './department.ts'

export interface ParsedCourseCode {
	department: string
	courseNumber: number
	/** Honors / suffix letter e.g. H in 1332H */
	suffix: string | null
	raw: string
}

export interface CourseMatchResult {
	matches: boolean
	confidence: number
	parsed: ParsedCourseCode | null
	reason: string
}

const COURSE_CODE_PATTERN =
	/\b([A-Z]{2,5})\s*[-.]?\s*(\d{3,4})([A-Z]{0,2})\b/gi

/** Pull human-readable course codes from RMP `class` / course_context strings. */
export function extractCourseCodes(text: string): ParsedCourseCode[] {
	const results: ParsedCourseCode[] = []
	const seen = new Set<string>()

	for (const match of text.matchAll(COURSE_CODE_PATTERN)) {
		const department = normalizeDepartmentCode(match[1])
		const courseNumber = parseInt(match[2], 10)
		const suffix = match[3]?.toUpperCase() || null
		if (Number.isNaN(courseNumber)) continue

		const key = `${department}-${courseNumber}${suffix ?? ''}`
		if (seen.has(key)) continue
		seen.add(key)

		results.push({
			department,
			courseNumber,
			suffix,
			raw: match[0],
		})
	}

	return results
}

export function normalizeCourseCode(
	department: string,
	courseNumber: number,
): string {
	return `${normalizeDepartmentCode(department)}${courseNumber}`
}

export function scoreCourseContextMatch(
	courseContext: string | null | undefined,
	department: string,
	courseNumber: number,
): CourseMatchResult {
	if (!courseContext?.trim()) {
		return {
			matches: false,
			confidence: 0,
			parsed: null,
			reason: 'empty_context',
		}
	}

	const targetDept = normalizeDepartmentCode(department)
	const extracted = extractCourseCodes(courseContext)

	if (extracted.length === 0) {
		const loose = courseContext.toUpperCase().replace(/[\s\-_.]/g, '')
		const target = normalizeCourseCode(targetDept, courseNumber)
		if (loose === target || loose.includes(target)) {
			return {
				matches: true,
				confidence: 0.7,
				parsed: null,
				reason: 'loose_substring',
			}
		}
		return {
			matches: false,
			confidence: 0,
			parsed: null,
			reason: 'no_code_found',
		}
	}

	let best: CourseMatchResult = {
		matches: false,
		confidence: 0,
		parsed: null,
		reason: 'no_match',
	}

	for (const code of extracted) {
		const numberMatch = code.courseNumber === courseNumber
		const deptMatch = departmentsEquivalent(code.department, targetDept)

		if (numberMatch && deptMatch) {
			const confidence = code.suffix ? 0.95 : 1
			if (confidence > best.confidence) {
				best = {
					matches: true,
					confidence,
					parsed: code,
					reason: 'exact_dept_number',
				}
			}
			continue
		}

		if (numberMatch && !deptMatch) {
			const confidence = 0.35
			if (confidence > best.confidence) {
				best = {
					matches: false,
					confidence,
					parsed: code,
					reason: 'number_only',
				}
			}
		}
	}

	return best
}

/** Minimum confidence to show an RMP review on a course page. */
export const COURSE_REVIEW_MATCH_THRESHOLD = 0.85

export function courseContextMatchesCourse(
	courseContext: string | null | undefined,
	department: string,
	courseNumber: number,
): boolean {
	return scoreCourseContextMatch(
		courseContext,
		department,
		courseNumber,
	).confidence >= COURSE_REVIEW_MATCH_THRESHOLD
}
