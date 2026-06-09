import { scoreRmpMatch } from './name-match.ts'
import {
	fetchRmpProfessorReviews,
	searchRmpProfessors,
} from './rmp-client.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

const MATCH_CONFIDENCE_AUTO = 0.75
const DAILY_BATCH_SIZE = 100

export interface RmpSyncResult {
	instructorsProcessed: number
	matchesLinked: number
	reviewsUpserted: number
	failures: number
}

export async function runRmpSync(
	supabase: SupabaseClient,
): Promise<RmpSyncResult> {
	const result: RmpSyncResult = {
		instructorsProcessed: 0,
		matchesLinked: 0,
		reviewsUpserted: 0,
		failures: 0,
	}

	const { data: instructors, error } = await supabase
		.from('instructors')
		.select('id, name, department, rmp_professor_id, rmp_synced_at')
		.order('rmp_synced_at', { ascending: true, nullsFirst: true })
		.limit(DAILY_BATCH_SIZE)

	if (error) throw error

	for (const instructor of instructors ?? []) {
		result.instructorsProcessed++
		try {
			const linked = await syncInstructorRmp(supabase, instructor)
			if (linked) result.matchesLinked++
		} catch {
			result.failures++
		}
	}

	return result
}

async function syncInstructorRmp(
	supabase: SupabaseClient,
	instructor: {
		id: string
		name: string
		department: string
		rmp_professor_id: string | null
	},
): Promise<boolean> {
	let rmpId = instructor.rmp_professor_id

	if (!rmpId) {
		const candidates = await searchRmpProfessors(instructor.name)
		const match = scoreRmpMatch(
			instructor.name,
			instructor.department,
			candidates,
		)
		if (!match) return false

		rmpId = match.professor.rmpProfessorId
		const status = match.confidence >= MATCH_CONFIDENCE_AUTO
			? 'auto_matched'
			: 'pending'

		await supabase.from('instructor_rmp_candidates').upsert(
			{
				instructor_id: instructor.id,
				rmp_professor_id: rmpId,
				rmp_name: match.professor.name,
				rmp_department: match.professor.department,
				match_confidence: match.confidence,
				status,
			},
			{ onConflict: 'instructor_id,rmp_professor_id' },
		)

		if (match.confidence < MATCH_CONFIDENCE_AUTO) return false

		await supabase
			.from('instructors')
			.update({
				rmp_professor_id: rmpId,
				rmp_quality: match.professor.quality,
				rmp_difficulty: match.professor.difficulty,
				rmp_would_take_again: match.professor.wouldTakeAgain,
				rmp_rating_count: match.professor.ratingCount,
				rmp_department: match.professor.department,
				rating: match.professor.quality,
				rmp_synced_at: new Date().toISOString(),
			})
			.eq('id', instructor.id)
	}

	const reviews = await fetchRmpProfessorReviews(rmpId!)
	for (const review of reviews) {
		await supabase.from('instructor_reviews').upsert(
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
	}

	await supabase
		.from('instructors')
		.update({ rmp_synced_at: new Date().toISOString() })
		.eq('id', instructor.id)

	return true
}
