import { BannerSession } from './banner-session.ts'
import {
	fetchBannerSectionsForSubject,
	fetchBannerSubjects,
	fetchBannerTerms,
	selectTermsToSync,
} from './banner-client.ts'
import { normalizeInstructorName } from './normalize.ts'
import type { BannerSectionRow } from './types.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export interface BannerSyncResult {
	termsSynced: number
	sectionsUpserted: number
	sectionsLinked: number
	sectionsDeactivated: number
	failures: number
}

export async function runBannerSync(
	supabase: SupabaseClient,
): Promise<BannerSyncResult> {
	const result: BannerSyncResult = {
		termsSynced: 0,
		sectionsUpserted: 0,
		sectionsLinked: 0,
		sectionsDeactivated: 0,
		failures: 0,
	}

	const allTerms = await fetchBannerTerms()
	const terms = selectTermsToSync(allTerms, 2)
	const session = new BannerSession()

	for (const term of terms) {
		const { data: termRow, error: termError } = await supabase
			.from('terms')
			.upsert(
				{
					semester: term.semester,
					year: term.year,
					banner_term_code: term.bannerTermCode,
					synced_at: new Date().toISOString(),
				},
				{ onConflict: 'banner_term_code' },
			)
			.select('id')
			.single()
		if (termError) {
			result.failures++
			continue
		}
		result.termsSynced++

		const termId = termRow.id as string
		await session.initTerm(term.bannerTermCode)

		const subjects = await fetchBannerSubjects(session, term.bannerTermCode)
		const seenCrns = new Set<string>()
		const linkGroups = new Map<
			string,
			Array<{ crn: string; scheduleType: string | null }>
		>()

		for (const subject of subjects) {
			let sections: BannerSectionRow[] = []
			try {
				sections = await fetchBannerSectionsForSubject(
					session,
					term.bannerTermCode,
					subject,
				)
			} catch {
				result.failures++
				continue
			}

			for (const section of sections) {
				try {
					await upsertBannerSection(supabase, termId, section)
					seenCrns.add(section.crn)
					result.sectionsUpserted++
					if (section.linkedBannerSectionId) {
						const group = linkGroups.get(section.linkedBannerSectionId)
							?? []
						group.push({
							crn: section.crn,
							scheduleType: section.scheduleType,
						})
						linkGroups.set(section.linkedBannerSectionId, group)
					}
				} catch {
					result.failures++
				}
			}
		}

		for (const [, members] of linkGroups) {
			if (members.length < 2) continue
			try {
				const linked = await linkSectionGroup(supabase, termId, members)
				result.sectionsLinked += linked
			} catch {
				result.failures++
			}
		}

		const { data: stale } = await supabase
			.from('sections')
			.select('id, crn')
			.eq('term_id', termId)
			.eq('is_active', true)
		for (const row of stale ?? []) {
			if (!seenCrns.has(row.crn as string)) {
				await supabase
					.from('sections')
					.update({ is_active: false })
					.eq('id', row.id)
				result.sectionsDeactivated++
			}
		}
	}

	return result
}

async function linkSectionGroup(
	supabase: SupabaseClient,
	termId: string,
	members: Array<{ crn: string; scheduleType: string | null }>,
): Promise<number> {
	const lecture = members.find((m) =>
		(m.scheduleType ?? '').toLowerCase().includes('lecture')
	) ?? members[0]
	const children = members.filter((m) => m.crn !== lecture.crn)
	if (children.length === 0) return 0

	const { data: parent } = await supabase
		.from('sections')
		.select('id')
		.eq('term_id', termId)
		.eq('crn', lecture.crn)
		.maybeSingle()
	if (!parent?.id) return 0

	let linked = 0
	for (const child of children) {
		const { data: childRow } = await supabase
			.from('sections')
			.select('id')
			.eq('term_id', termId)
			.eq('crn', child.crn)
			.maybeSingle()
		if (!childRow?.id) continue
		const { error } = await supabase
			.from('sections')
			.update({ linked_section_id: parent.id })
			.eq('id', childRow.id)
		if (!error) linked++
	}
	return linked
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
				credit_hours: section.creditHours || 3,
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
	const normalized = normalizeInstructorName(name)
	const displayName = name.trim().toUpperCase() === 'TBA'
		? `TBA (${department})`
		: name.trim()

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
	if (byName?.id) return byName.id as string

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
