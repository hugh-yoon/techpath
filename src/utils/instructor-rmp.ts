import type { Instructor } from '@/types'

export function hasRmpProfile(instructor: Pick<
	Instructor,
	'rmp_professor_id' | 'rmp_quality' | 'rmp_rating_count'
>): boolean {
	return (
		instructor.rmp_professor_id != null ||
		instructor.rmp_quality != null ||
		(instructor.rmp_rating_count != null && instructor.rmp_rating_count > 0)
	)
}

export function hasRmpSyncAttempt(instructor: Pick<Instructor, 'rmp_synced_at'>): boolean {
	return instructor.rmp_synced_at != null
}

export function buildRmpProfessorUrl(rmpProfessorId: string | null | undefined): string | null {
	if (!rmpProfessorId) return null
	return `https://www.ratemyprofessors.com/professor/${rmpProfessorId}`
}
