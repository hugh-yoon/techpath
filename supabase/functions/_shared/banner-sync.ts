import { BannerSession } from './banner-session.ts'
import {
	fetchBannerSectionsForSubject,
	fetchBannerSubjects,
	fetchBannerTerms,
	selectTermsToSync,
} from './banner-client.ts'
import { normalizeInstructorName, parsePersonName } from './matching/person-name.ts'
import type { BannerSectionRow } from './types.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

const SUBJECTS_PER_BATCH = 3
const SUBJECT_RESYNC_SECTION_LIMIT = 200

export interface BannerSyncOptions {
	/** Reset subject offsets and re-pull all terms (monthly). */
	reset?: boolean
	/** Re-sync specific Banner subjects (e.g. CS, CSE) regardless of batch offset. */
	subjects?: string[]
	/** Section offset within each subject during targeted resync. */
	subjectSectionOffset?: number
	/** Max sections per subject per targeted resync invocation. */
	subjectSectionLimit?: number
}

export interface BannerSyncResult {
	termsSynced: number
	sectionsUpserted: number
	sectionsLinked: number
	sectionsDeactivated: number
	subjectsProcessed: number
	termsCompleted: number
	failures: number
	subjectSectionOffset?: number
	subjectSectionLimit?: number
	subjectSectionsProcessed?: number
	subjectSectionsTotal?: number
	subjectResyncComplete?: boolean
}

export async function runBannerSync(
	supabase: SupabaseClient,
	options: BannerSyncOptions = {},
): Promise<BannerSyncResult> {
	const result: BannerSyncResult = {
		termsSynced: 0,
		sectionsUpserted: 0,
		sectionsLinked: 0,
		sectionsDeactivated: 0,
		subjectsProcessed: 0,
		termsCompleted: 0,
		failures: 0,
	}

	const allTerms = await fetchBannerTerms()
	const terms = selectTermsToSync(allTerms, 2)

	if (options.reset) {
		for (const term of terms) {
			await resetTermProgress(supabase, term)
		}
	}

	if (options.subjects?.length) {
		const subjectResult = await syncNamedSubjects(
			supabase,
			terms,
			options.subjects,
			options.subjectSectionOffset ?? 0,
			options.subjectSectionLimit ?? SUBJECT_RESYNC_SECTION_LIMIT,
		)
		result.termsSynced = subjectResult.termsSynced
		result.sectionsUpserted += subjectResult.sectionsUpserted
		result.sectionsLinked += subjectResult.sectionsLinked
		result.sectionsDeactivated += subjectResult.sectionsDeactivated
		result.subjectsProcessed += subjectResult.subjectsProcessed
		result.failures += subjectResult.failures
		result.termsCompleted = await countCompletedTerms(supabase, terms)
		return { ...result, ...subjectResult.meta }
	}

	const termToSync = await pickIncompleteTerm(supabase, terms)
	if (!termToSync) {
		result.termsCompleted = terms.length
		return result
	}

	const termResult = await syncTermBatch(supabase, termToSync, false)
	result.termsSynced = 1
	result.sectionsUpserted += termResult.sectionsUpserted
	result.sectionsLinked += termResult.sectionsLinked
	result.sectionsDeactivated += termResult.sectionsDeactivated
	result.subjectsProcessed += termResult.subjectsProcessed
	result.failures += termResult.failures
	result.termsCompleted = await countCompletedTerms(supabase, terms)

	return result
}

async function syncNamedSubjects(
	supabase: SupabaseClient,
	terms: Array<{ bannerTermCode: string; semester: string; year: number }>,
	subjects: string[],
	sectionOffset: number,
	sectionLimit: number,
) {
	const outcome = {
		termsSynced: 0,
		sectionsUpserted: 0,
		sectionsLinked: 0,
		sectionsDeactivated: 0,
		subjectsProcessed: 0,
		failures: 0,
		meta: {
			subjectSectionOffset: sectionOffset,
			subjectSectionLimit: sectionLimit,
			subjectSectionsProcessed: 0,
			subjectSectionsTotal: 0,
			subjectResyncComplete: true,
		},
	}

	const session = new BannerSession()
	for (const term of terms) {
		const syncStartedAt = new Date().toISOString()
		const { data: termRow, error: termError } = await supabase
			.from('terms')
			.upsert(
				{
					semester: term.semester,
					year: term.year,
					banner_term_code: term.bannerTermCode,
					synced_at: syncStartedAt,
				},
				{ onConflict: 'banner_term_code' },
			)
			.select('id, banner_sync_started_at')
			.single()

		if (termError || !termRow) {
			outcome.failures++
			continue
		}

		outcome.termsSynced++
		const termId = termRow.id as string
		await session.initTerm(term.bannerTermCode)

		for (const subject of subjects) {
			let sections: BannerSectionRow[] = []
			try {
				sections = await fetchBannerSectionsForSubject(
					session,
					term.bannerTermCode,
					subject,
				)
			} catch {
				outcome.failures++
				continue
			}

			outcome.meta.subjectSectionsTotal += sections.length
			const slice = sections.slice(sectionOffset, sectionOffset + sectionLimit)
			if (sectionOffset + sectionLimit < sections.length) {
				outcome.meta.subjectResyncComplete = false
			}

			let subjectUpserts = 0
			for (const section of slice) {
				try {
					await upsertBannerSection(supabase, termId, section)
					outcome.sectionsUpserted++
					subjectUpserts++
					outcome.meta.subjectSectionsProcessed++
				} catch {
					outcome.failures++
				}
			}

			if (subjectUpserts > 0 || sections.length === 0) {
				outcome.subjectsProcessed++
			}
		}

		outcome.sectionsLinked += await linkTermSectionGroups(supabase, termId)
	}

	return outcome
}

async function resetTermProgress(
	supabase: SupabaseClient,
	term: { bannerTermCode: string; semester: string; year: number },
) {
	const syncStartedAt = new Date().toISOString()
	await supabase.from('terms').upsert(
		{
			semester: term.semester,
			year: term.year,
			banner_term_code: term.bannerTermCode,
			banner_subject_offset: 0,
			banner_sync_started_at: syncStartedAt,
			synced_at: syncStartedAt,
		},
		{ onConflict: 'banner_term_code' },
	)
}

async function pickIncompleteTerm(
	supabase: SupabaseClient,
	terms: Array<{ bannerTermCode: string; semester: string; year: number }>,
) {
	for (const term of terms) {
		const { data: row } = await supabase
			.from('terms')
			.select('banner_subject_offset, banner_subjects_total')
			.eq('banner_term_code', term.bannerTermCode)
			.maybeSingle()

		const offset = (row?.banner_subject_offset as number) ?? 0
		const total = row?.banner_subjects_total as number | null
		if (total == null || offset < total) return term
	}
	return null
}

async function countCompletedTerms(
	supabase: SupabaseClient,
	terms: Array<{ bannerTermCode: string }>,
): Promise<number> {
	let count = 0
	for (const term of terms) {
		const { data: row } = await supabase
			.from('terms')
			.select('banner_subject_offset, banner_subjects_total')
			.eq('banner_term_code', term.bannerTermCode)
			.maybeSingle()
		const offset = (row?.banner_subject_offset as number) ?? 0
		const total = row?.banner_subjects_total as number | null
		if (total != null && offset >= total) count++
	}
	return count
}

async function syncTermBatch(
	supabase: SupabaseClient,
	term: { bannerTermCode: string; semester: string; year: number },
	_reset: boolean,
) {
	const outcome = {
		sectionsUpserted: 0,
		sectionsLinked: 0,
		sectionsDeactivated: 0,
		subjectsProcessed: 0,
		failures: 0,
		completed: false,
	}

	const syncStartedAt = new Date().toISOString()
	const { data: termRow, error: termError } = await supabase
		.from('terms')
		.upsert(
			{
				semester: term.semester,
				year: term.year,
				banner_term_code: term.bannerTermCode,
				synced_at: syncStartedAt,
			},
			{ onConflict: 'banner_term_code' },
		)
		.select('id, banner_subject_offset, banner_subjects_total, banner_sync_started_at')
		.single()

	if (termError || !termRow) {
		outcome.failures++
		return outcome
	}

	const termId = termRow.id as string
	const offset = (termRow.banner_subject_offset as number) ?? 0
	const cycleStarted = (termRow.banner_sync_started_at as string) ?? syncStartedAt

	if (
		termRow.banner_subjects_total != null &&
		offset >= (termRow.banner_subjects_total as number)
	) {
		outcome.completed = true
		return outcome
	}

	const session = new BannerSession()
	await session.initTerm(term.bannerTermCode)
	const subjects = await fetchBannerSubjects(session, term.bannerTermCode)
	const total = subjects.length

	if (termRow.banner_subjects_total !== total) {
		await supabase
			.from('terms')
			.update({ banner_subjects_total: total })
			.eq('id', termId)
	}

	const batch = subjects.slice(offset, offset + SUBJECTS_PER_BATCH)

	for (const subject of batch) {
		let sections: BannerSectionRow[] = []
		try {
			sections = await fetchBannerSectionsForSubject(
				session,
				term.bannerTermCode,
				subject,
			)
		} catch {
			outcome.failures++
			continue
		}

		for (const section of sections) {
			try {
				await upsertBannerSection(supabase, termId, section)
				outcome.sectionsUpserted++
			} catch {
				outcome.failures++
			}
		}
		outcome.subjectsProcessed++
	}

	const newOffset = offset + batch.length
	const completed = newOffset >= total

	await supabase
		.from('terms')
		.update({
			banner_subject_offset: completed ? total : newOffset,
			synced_at: new Date().toISOString(),
		})
		.eq('id', termId)

	if (completed) {
		outcome.sectionsLinked = await linkTermSectionGroups(supabase, termId)
		outcome.sectionsDeactivated = await deactivateStaleSections(
			supabase,
			termId,
			cycleStarted,
		)
		outcome.completed = true
	}

	return outcome
}

async function linkTermSectionGroups(
	supabase: SupabaseClient,
	termId: string,
): Promise<number> {
	const { data: rows } = await supabase
		.from('sections')
		.select('id, crn, schedule_type, link_group_id')
		.eq('term_id', termId)
		.not('link_group_id', 'is', null)

	const groups = new Map<string, Array<{
		id: string
		crn: string
		scheduleType: string | null
	}>>()

	for (const row of rows ?? []) {
		const gid = row.link_group_id as string
		const group = groups.get(gid) ?? []
		group.push({
			id: row.id as string,
			crn: row.crn as string,
			scheduleType: row.schedule_type as string | null,
		})
		groups.set(gid, group)
	}

	let linked = 0
	for (const [, members] of groups) {
		if (members.length < 2) continue
		const lecture = members.find((m) =>
			(m.scheduleType ?? '').toLowerCase().includes('lecture')
		) ?? members[0]
		const children = members.filter((m) => m.id !== lecture.id)
		for (const child of children) {
			const { error } = await supabase
				.from('sections')
				.update({ linked_section_id: lecture.id })
				.eq('id', child.id)
			if (!error) linked++
		}
	}
	return linked
}

async function deactivateStaleSections(
	supabase: SupabaseClient,
	termId: string,
	cycleStartedAt: string,
): Promise<number> {
	const { data: stale } = await supabase
		.from('sections')
		.select('id')
		.eq('term_id', termId)
		.eq('is_active', true)
		.lt('synced_at', cycleStartedAt)

	let count = 0
	for (const row of stale ?? []) {
		await supabase
			.from('sections')
			.update({ is_active: false })
			.eq('id', row.id)
		count++
	}
	return count
}

async function upsertBannerSection(
	supabase: SupabaseClient,
	termId: string,
	section: BannerSectionRow,
) {
	const { data: course, error: courseError } = await supabase
		.from('courses')
		.upsert(
			{
				department: section.department,
				course_number: section.courseNumber,
				course_name: section.courseTitle,
				credit_hours: Math.max(1, Math.round(section.creditHours || 3)),
			},
			{ onConflict: 'department,course_number' },
		)
		.select('id')
		.single()
	if (courseError) throw courseError

	const instructorId = await upsertInstructor(
		supabase,
		section.instructorName,
		section.department,
	)

	const { error: sectionError } = await supabase
		.from('sections')
		.upsert(
			{
				term_id: termId,
				course_id: course.id,
				instructor_id: instructorId,
				section_code: section.sectionCode,
				day_pattern: section.dayPattern,
				start_time: section.startTime,
				end_time: section.endTime,
				location: section.location,
				crn: section.crn,
				schedule_type: section.scheduleType,
				campus: section.campus,
				contact_hours: section.contactHours,
				banner_section_id: section.bannerSectionId,
				link_group_id: section.linkedBannerSectionId,
				is_active: true,
				synced_at: new Date().toISOString(),
			},
			{ onConflict: 'term_id,crn' },
		)
	if (sectionError) throw sectionError
}

async function upsertInstructor(
	supabase: SupabaseClient,
	name: string,
	department: string,
): Promise<string> {
	const displayName = name.trim().toUpperCase() === 'TBA'
		? `TBA (${department})`
		: formatInstructorDisplayName(name)
	const parsed = parsePersonName(name)
	const nameKey = parsed?.sortKey ?? normalizeInstructorName(name)
	const normalized = `${nameKey}::${department.toUpperCase()}`

	const { data: existing } = await supabase
		.from('instructors')
		.select('id')
		.eq('name_normalized', normalized)
		.maybeSingle()
	if (existing?.id) return existing.id as string

	const { data: byName } = await supabase
		.from('instructors')
		.select('id')
		.eq('name', displayName)
		.maybeSingle()
	if (byName?.id) {
		await supabase
			.from('instructors')
			.update({ name_normalized: normalized })
			.eq('id', byName.id)
		return byName.id as string
	}

	const { data, error } = await supabase
		.from('instructors')
		.insert({
			name: displayName,
			department,
			name_normalized: normalized,
		})
		.select('id')
		.single()
	if (error) throw error
	return data.id as string
}

function formatInstructorDisplayName(name: string): string {
	const parsed = parsePersonName(name)
	if (!parsed) return name.trim()
	if (!parsed.first) return titleCaseToken(parsed.last)
	return [parsed.first, parsed.middle, parsed.last]
		.filter(Boolean)
		.map(titleCaseToken)
		.join(' ')
}

function titleCaseToken(token: string): string {
	if (!token) return token
	return token.charAt(0).toUpperCase() + token.slice(1)
}
