import { mapBannerSemester, snapTimeToFifteenMinutes } from './normalize.ts'
import type { BannerSectionRow, BannerTerm } from './types.ts'

const BANNER_BASE =
	'https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb'

/**
 * Banner SSB class search JSON endpoints (Ellucian).
 * These paths are used by the public class-search SPA.
 */
export const BANNER_ENDPOINTS = {
	terms: `${BANNER_BASE}/classSearch/getTerms`,
	subjects: `${BANNER_BASE}/classSearch/get_subject`,
	search: `${BANNER_BASE}/classSearch/get_course`,
} as const

export async function fetchBannerTerms(): Promise<BannerTerm[]> {
	const res = await fetch(
		`${BANNER_ENDPOINTS.terms}?searchTerm=&offset=1&max=50`,
		{ headers: { Accept: 'application/json' } },
	)
	if (!res.ok) {
		throw new Error(`Banner getTerms failed: ${res.status}`)
	}
	const payload = await res.json()
	const rows = Array.isArray(payload) ? payload : payload?.data ?? []
	return rows
		.map((row: Record<string, string>) => {
			const description = row.description ?? row.termDescription ?? ''
			const semester = mapBannerSemester(description)
			const yearMatch = description.match(/\d{4}/)
			if (!semester || !yearMatch) return null
			return {
				bannerTermCode: row.code ?? row.termCode ?? '',
				semester,
				year: Number(yearMatch[0]),
				description,
			} satisfies BannerTerm
		})
		.filter((t: BannerTerm | null): t is BannerTerm => !!t?.bannerTermCode)
}

export function selectTermsToSync(
	terms: BannerTerm[],
	maxTerms = 2,
): BannerTerm[] {
	const now = new Date()
	const currentYear = now.getFullYear()
	const sorted = [...terms].sort((a, b) => {
		if (a.year !== b.year) return a.year - b.year
		const order = { Spring: 1, Summer: 2, Fall: 3 }
		return order[a.semester] - order[b.semester]
	})
	return sorted
		.filter((t) => t.year >= currentYear - 1 && t.year <= currentYear + 1)
		.slice(0, maxTerms)
}

export async function fetchBannerSubjects(
	termCode: string,
): Promise<string[]> {
	const res = await fetch(
		`${BANNER_ENDPOINTS.subjects}?term=${encodeURIComponent(termCode)}`,
		{ headers: { Accept: 'application/json' } },
	)
	if (!res.ok) {
		throw new Error(`Banner get_subject failed: ${res.status}`)
	}
	const payload = await res.json()
	const rows = Array.isArray(payload) ? payload : payload?.data ?? []
	return rows
		.map((row: Record<string, string>) => row.code ?? row.subject)
		.filter(Boolean)
}

export async function fetchBannerSectionsForSubject(
	termCode: string,
	subject: string,
): Promise<BannerSectionRow[]> {
	const body = new URLSearchParams({
		term: termCode,
		subject,
		courseNumber: '',
		courseId: '',
		pageOffset: '0',
		pageMaxSize: '500',
	})
	const res = await fetch(BANNER_ENDPOINTS.search, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body,
	})
	if (!res.ok) {
		throw new Error(
			`Banner get_course failed for ${subject}: ${res.status}`,
		)
	}
	const payload = await res.json()
	const courses = payload?.data ?? payload?.courses ?? payload ?? []
	if (!Array.isArray(courses)) return []

	const rows: BannerSectionRow[] = []
	for (const course of courses) {
		const meetings = course.meetingsFaculty ?? course.meetings ?? []
		const faculty = course.faculty ?? []
		const instructorName = faculty[0]?.displayName
			?? faculty[0]?.name
			?? 'TBA'
		const dayPattern = parseMeetingDays(meetings)
		const { startTime, endTime } = parseMeetingTimes(meetings)
		rows.push({
			bannerSectionId: String(course.id ?? course.courseReferenceNumber),
			bannerTermCode: termCode,
			department: course.subject ?? subject,
			courseNumber: Number(course.courseNumber),
			courseTitle: course.courseTitle ?? course.title ?? '',
			creditHours: Number(course.creditHours ?? course.creditHour ?? 0),
			sectionCode: course.sequenceNumber ?? course.section ?? 'A',
			crn: String(course.courseReferenceNumber ?? course.crn),
			instructorName,
			scheduleType: course.scheduleTypeDescription
				?? course.instructionalMethod
				?? null,
			campus: course.campusDescription ?? null,
			location: meetings[0]?.building
				? `${meetings[0].building} ${meetings[0]?.room ?? ''}`.trim()
				: null,
			contactHours: course.contactHours
				? Number(course.contactHours)
				: null,
			dayPattern,
			startTime: startTime ? snapTimeToFifteenMinutes(startTime) : '09:00:00',
			endTime: endTime ? snapTimeToFifteenMinutes(endTime) : '10:15:00',
			linkedBannerSectionId: course.linkIdentifier
				? String(course.linkIdentifier)
				: null,
		})
	}
	return rows
}

function parseMeetingDays(
	meetings: Array<Record<string, unknown>>,
): string[] {
	const days: string[] = []
	const map: Record<string, string> = {
		monday: 'Monday',
		tuesday: 'Tuesday',
		wednesday: 'Wednesday',
		thursday: 'Thursday',
		friday: 'Friday',
	}
	for (const meeting of meetings) {
		for (const [key, label] of Object.entries(map)) {
			if (meeting[key] === true && !days.includes(label)) {
				days.push(label)
			}
		}
	}
	return days.length > 0 ? days : ['Monday']
}

function parseMeetingTimes(
	meetings: Array<Record<string, string>>,
): { startTime: string | null; endTime: string | null } {
	const begin = meetings[0]?.beginTime ?? meetings[0]?.startTime
	const end = meetings[0]?.endTime
	if (!begin) return { startTime: null, endTime: null }
	return {
		startTime: formatBannerTime(begin),
		endTime: end ? formatBannerTime(end) : null,
	}
}

function formatBannerTime(raw: string): string {
	if (raw.includes(':')) return raw.length === 5 ? `${raw}:00` : raw
	if (raw.length === 4) {
		return `${raw.slice(0, 2)}:${raw.slice(2)}:00`
	}
	return raw
}
