import {
	RMP_AUTO_MATCH_THRESHOLD,
	scoreRmpMatch,
	searchRmpProfessorCandidates,
} from './name-match.ts'
import {
	fetchRmpProfessorProfile,
	searchRmpProfessors,
} from './rmp-client.ts'
import { fetchScheduledInstructorIds } from './scheduled-instructors.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

const DAILY_BATCH_SIZE = 100
const RMP_REVIEWS_PAGE_SIZE = 50

export interface RmpSyncResult {
	instructorsProcessed: number
	matchesLinked: number
	reviewsUpserted: number
	failures: number
}

export interface RmpSyncOptions {
	/** Sync specific schedule instructors (admin / backfill). */
	instructorIds?: string[]
	batchSize?: number
}

export async function runRmpSync(
	supabase: SupabaseClient,
	options: RmpSyncOptions = {},
): Promise<RmpSyncResult> {
	const result: RmpSyncResult = {
		instructorsProcessed: 0,
		matchesLinked: 0,
		reviewsUpserted: 0,
		failures: 0,
	}

	const scheduledInstructorIds = await fetchScheduledInstructorIds(supabase)
	if (scheduledInstructorIds.length === 0) return result

	const targetIds = options.instructorIds?.length
		? options.instructorIds
		: scheduledInstructorIds

	if (targetIds.length === 0) return result

	const batchSize = options.batchSize ?? DAILY_BATCH_SIZE

	let query = supabase
		.from('instructors')
		.select('id, name, department, rmp_professor_id')
		.in('id', targetIds)
		.order('rmp_synced_at', { ascending: true, nullsFirst: true })
		.limit(batchSize)

	const { data: instructors, error } = await query
	if (error) throw error

	for (const instructor of instructors ?? []) {
		result.instructorsProcessed++
		try {
			const stats = await syncInstructorRmp(supabase, instructor)
			if (stats.linked) result.matchesLinked++
			result.reviewsUpserted += stats.reviewsUpserted
		} catch {
			result.failures++
		}
	}

	return result
}

async function markRmpSyncAttempted(
	supabase: SupabaseClient,
	instructorId: string,
) {
	await supabase
		.from('instructors')
		.update({ rmp_synced_at: new Date().toISOString() })
		.eq('id', instructorId)
}

async function syncInstructorRmp(
	supabase: SupabaseClient,
	instructor: {
		id: string
		name: string
		department: string
		rmp_professor_id: string | null
	},
): Promise<{ linked: boolean; reviewsUpserted: number }> {
	let rmpNodeId: string | null = null
	let rmpLegacyId = instructor.rmp_professor_id

	if (!rmpLegacyId) {
		const candidates = await searchRmpProfessorCandidates(
			searchRmpProfessors,
			instructor.name,
		)
		const match = scoreRmpMatch(
			instructor.name,
			instructor.department,
			candidates,
		)
		if (!match) {
			await markRmpSyncAttempted(supabase, instructor.id)
			return { linked: false, reviewsUpserted: 0 }
		}

		rmpLegacyId = match.professor.rmpProfessorId
		rmpNodeId = match.professor.rmpNodeId ?? null
		const status = match.confidence >= RMP_AUTO_MATCH_THRESHOLD
			? 'auto_matched'
			: 'pending'

		await supabase.from('instructor_rmp_candidates').upsert(
			{
				instructor_id: instructor.id,
				rmp_professor_id: rmpLegacyId,
				rmp_name: match.professor.name,
				rmp_department: match.professor.department,
				match_confidence: match.confidence,
				status,
			},
			{ onConflict: 'instructor_id,rmp_professor_id' },
		)

		if (match.confidence < RMP_AUTO_MATCH_THRESHOLD) {
			await markRmpSyncAttempted(supabase, instructor.id)
			return { linked: false, reviewsUpserted: 0 }
		}
	}

	if (!rmpNodeId) {
		const search = await searchRmpProfessorCandidates(
			searchRmpProfessors,
			instructor.name,
		)
		const hit = search.find((c) => c.rmpProfessorId === rmpLegacyId)
		rmpNodeId = hit?.rmpNodeId ?? null
	}
	if (!rmpNodeId) {
		await markRmpSyncAttempted(supabase, instructor.id)
		return { linked: false, reviewsUpserted: 0 }
	}

	const { summary, reviews } = await fetchRmpProfessorProfile(rmpNodeId)

	await supabase
		.from('instructors')
		.update({
			rmp_professor_id: summary.rmpProfessorId,
			rmp_quality: summary.quality,
			rmp_difficulty: summary.difficulty,
			rmp_would_take_again: summary.wouldTakeAgain,
			rmp_rating_count: summary.ratingCount,
			rmp_department: summary.department,
			rating: summary.quality,
			rmp_synced_at: new Date().toISOString(),
		})
		.eq('id', instructor.id)

	let reviewsUpserted = 0
	for (const review of reviews) {
		const { error } = await supabase.from('instructor_reviews').upsert(
			{
				instructor_id: instructor.id,
				source: 'rmp',
				external_review_id: review.externalReviewId,
				rating: review.rating,
				difficulty: review.difficulty,
				would_take_again: review.wouldTakeAgain,
				comment: review.comment,
				course_context: review.courseContext,
				term_context: review.termContext,
				scraped_at: new Date().toISOString(),
			},
			{ onConflict: 'external_review_id' },
		)
		if (!error) reviewsUpserted++
	}

	return { linked: true, reviewsUpserted }
}
