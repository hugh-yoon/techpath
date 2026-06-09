import { BannerSession } from './banner-session.ts'
import { mapBannerSemester, snapTimeToFifteenMinutes } from './normalize.ts'
import type { BannerSectionRow, BannerTerm } from './types.ts'

export async function fetchBannerTerms(): Promise<BannerTerm[]> {
	const res = await fetch(
		'https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?searchTerm=&offset=1&max=50',
		{ headers: { Accept: 'application/json' } },
	)
	if (!res.ok) throw new Error(`Banner getTerms failed: ${res.status}`)
	const rows = await res.json()
	return (Array.isArray(rows) ? rows : [])
		.map((row: Record<string, string>) => {
			const description = row.description ?? ''
			const semester = mapBannerSemester(description)
			const yearMatch = description.match(/\d{4}/)
			if (!semester || !yearMatch) return null
			if (description.toLowerCase().includes('view only')) return null
			return {
				bannerTermCode: row.code ?? '',
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
	const year = new Date().getFullYear()
	const eligible = terms.filter(
		(t) => t.year >= year && t.year <= year + 1 && t.semester !== 'Summer',
	)

	const picked: BannerTerm[] = []
	const fallCurrent = eligible.find(
		(t) => t.semester === 'Fall' && t.year === year,
	)
	const springNext = eligible.find(
		(t) => t.semester === 'Spring' && t.year === year + 1,
	)
	const springCurrent = eligible.find(
		(t) => t.semester === 'Spring' && t.year === year,
	)
	const fallNext = eligible.find(
		(t) => t.semester === 'Fall' && t.year === year + 1,
	)

	if (fallCurrent) picked.push(fallCurrent)
	if (springNext && picked.length < maxTerms) picked.push(springNext)
	else if (fallNext && picked.length < maxTerms) picked.push(fallNext)
	else if (springCurrent && picked.length < maxTerms) picked.push(springCurrent)

	if (picked.length < maxTerms) {
		for (const t of eligible) {
			if (picked.some((p) => p.bannerTermCode === t.bannerTermCode)) continue
			picked.push(t)
			if (picked.length >= maxTerms) break
		}
	}

	return picked.slice(0, maxTerms)
}

export async function fetchBannerSubjects(
	session: BannerSession,
	termCode: string,
): Promise<string[]> {
	const res = await session.fetch(
		`classSearch/get_subject?searchTerm=&term=${encodeURIComponent(termCode)}&offset=1&max=500`,
	)
	if (!res.ok) throw new Error(`Banner get_subject failed: ${res.status}`)
	const rows = await res.json()
	if (!Array.isArray(rows)) return []
	return rows
		.map((row: Record<string, string>) => row.code)
		.filter(Boolean)
}

export async function fetchBannerSectionsForSubject(
	session: BannerSession,
	termCode: string,
	subject: string,
): Promise<BannerSectionRow[]> {
	const rows: BannerSectionRow[] = []
	let pageOffset = 0
	const pageMaxSize = 500

	while (true) {
		const params = new URLSearchParams({
			txt_subject: subject,
			txt_courseNumber: '',
			txt_term: termCode,
			startDatepicker: '',
			endDatepicker: '',
			pageOffset: String(pageOffset),
			pageMaxSize: String(pageMaxSize),
			sortColumn: 'subjectDescription',
			sortDirection: 'asc',
		})
		const res = await session.fetch(
			`searchResults/searchResults?${params}`,
		)
		if (!res.ok) {
			throw new Error(
				`Banner searchResults failed for ${subject}: ${res.status}`,
			)
		}
		const payload = await res.json()
		if (!payload?.success) break

		const batch = payload.data ?? []
		if (!Array.isArray(batch) || batch.length === 0) break

		for (const course of batch) {
			rows.push(mapBannerCourse(course, termCode, subject))
		}

		const fetched = payload.sectionsFetchedCount ?? batch.length
		pageOffset += fetched
		if (fetched < pageMaxSize) break
		if (pageOffset >= (payload.totalCount ?? 0)) break
	}

	return rows
}

function mapBannerCourse(
	course: Record<string, unknown>,
	termCode: string,
	subject: string,
): BannerSectionRow {
	const meetings = (course.meetingsFaculty ?? []) as Array<{
		meetingTime?: Record<string, unknown>
	}>
	const faculty = (course.faculty ?? []) as Array<{
		displayName?: string
	}>
	const meetingTime = meetings[0]?.meetingTime ?? {}
	const instructorName = faculty[0]?.displayName ?? 'TBA'
	const dayPattern = parseMeetingDays(meetingTime)
	const startRaw = String(meetingTime.beginTime ?? '')
	const endRaw = String(meetingTime.endTime ?? '')

	return {
		bannerSectionId: String(course.id ?? course.courseReferenceNumber),
		bannerTermCode: termCode,
		department: String(course.subject ?? subject),
		courseNumber: Number(course.courseNumber),
		courseTitle: String(course.courseTitle ?? ''),
		creditHours: Number(course.creditHours ?? course.creditHourLow ?? 3),
		sectionCode: String(course.sequenceNumber ?? 'A'),
		crn: String(course.courseReferenceNumber),
		instructorName,
		scheduleType: course.scheduleTypeDescription
			? String(course.scheduleTypeDescription).replace(/\*$/, '')
			: null,
		campus: course.campusDescription
			? String(course.campusDescription).replace(/\*$/, '').trim()
			: null,
		location: meetingTime.buildingDescription
			? `${meetingTime.buildingDescription} ${meetingTime.room ?? ''}`
				.trim()
			: null,
		contactHours: meetingTime.hoursWeek
			? Number(meetingTime.hoursWeek)
			: null,
		dayPattern,
		startTime: startRaw
			? snapTimeToFifteenMinutes(formatBannerTime(startRaw))
			: '09:00:00',
		endTime: endRaw
			? snapTimeToFifteenMinutes(formatBannerTime(endRaw))
			: '10:15:00',
		linkedBannerSectionId: course.linkIdentifier
			? String(course.linkIdentifier)
			: null,
	}
}

function parseMeetingDays(meetingTime: Record<string, unknown>): string[] {
	const map: Record<string, string> = {
		monday: 'Monday',
		tuesday: 'Tuesday',
		wednesday: 'Wednesday',
		thursday: 'Thursday',
		friday: 'Friday',
	}
	const days: string[] = []
	for (const [key, label] of Object.entries(map)) {
		if (meetingTime[key] === true) days.push(label)
	}
	return days.length > 0 ? days : ['Monday']
}

function formatBannerTime(raw: string): string {
	if (raw.includes(':')) return raw.length === 5 ? `${raw}:00` : raw
	if (raw.length === 4) {
		return `${raw.slice(0, 2)}:${raw.slice(2)}:00`
	}
	return raw
}
