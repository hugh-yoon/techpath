import { supabase } from '@/lib/supabaseClient'
import { activeSectionTermOrFilter } from '@/lib/active-term-ids'
import { getCachedActiveTermIds } from '@/lib/active-term-cache'

export interface ScheduledInstructorRef {
	id: string
	name: string
	department: string
}

function parseEmbeddedInstructor(
	raw: unknown,
): ScheduledInstructorRef | null {
	if (!raw) return null
	const instructor = (Array.isArray(raw) ? raw[0] : raw) as ScheduledInstructorRef
	if (!instructor?.id || !instructor.name) return null
	return instructor
}

/**
 * Instructors assigned to at least one active section in display terms.
 * Schedule is the source of truth — RMP-only profiles are excluded.
 */
export async function fetchScheduledInstructors(): Promise<
	ScheduledInstructorRef[]
> {
	const activeTermIds = await getCachedActiveTermIds()
	const byId = new Map<string, ScheduledInstructorRef>()
	const pageSize = 1000
	let from = 0

	while (true) {
		let query = supabase
			.from('sections')
			.select('instructor_id, instructor:instructors(id, name, department)')
			.eq('is_active', true)
			.not('instructor_id', 'is', null)
			.range(from, from + pageSize - 1)
		const termOr = activeSectionTermOrFilter(activeTermIds)
		if (termOr) {
			query = query.or(termOr)
		}
		const { data, error } = await query
		if (error) throw error
		if (!data?.length) break

		for (const row of data) {
			const instructor = parseEmbeddedInstructor(row.instructor)
			if (!instructor) continue
			byId.set(instructor.id, instructor)
		}

		if (data.length < pageSize) break
		from += pageSize
	}

	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchScheduledInstructorIds(): Promise<Set<string>> {
	const instructors = await fetchScheduledInstructors()
	return new Set(instructors.map((instructor) => instructor.id))
}

export async function instructorHasScheduledSections(
	instructorId: string,
): Promise<boolean> {
	const ids = await fetchScheduledInstructorIds()
	return ids.has(instructorId)
}
