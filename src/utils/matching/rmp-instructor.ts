import { scoreDepartmentMatch } from './department'
import {
	buildRmpSearchQueries,
	parsePersonName,
	scorePersonNameMatch,
} from './person-name'

export interface RmpProfessorCandidate {
	rmpProfessorId: string
	rmpNodeId?: string
	name: string
	firstName?: string
	lastName?: string
	department: string | null
	ratingCount: number
}

export interface RmpMatchResult {
	professor: RmpProfessorCandidate
	confidence: number
	nameScore: number
	departmentScore: number
	reason: string
}

export const RMP_AUTO_MATCH_THRESHOLD = 0.82
export const RMP_MIN_CANDIDATE_THRESHOLD = 0.6

function candidateDisplayName(candidate: RmpProfessorCandidate): string {
	if (candidate.firstName && candidate.lastName) {
		return `${candidate.firstName} ${candidate.lastName}`
	}
	return candidate.name
}

function scoreCandidate(
	bannerName: string,
	bannerDepartment: string,
	candidate: RmpProfessorCandidate,
): Omit<RmpMatchResult, 'professor'> {
	const nameMatch = scorePersonNameMatch(
		bannerName,
		candidateDisplayName(candidate),
	)
	const departmentScore = scoreDepartmentMatch(
		bannerDepartment,
		candidate.department,
	)
	const ratingBoost = candidate.ratingCount > 0 ? 0.03 : 0

	let confidence =
		nameMatch.score * 0.78 +
		departmentScore * 0.19 +
		ratingBoost

	let reason = nameMatch.reason

	if (nameMatch.lastNameScore < 0.75) {
		confidence = Math.min(confidence, 0.55)
		reason = 'last_name_mismatch'
	} else if (nameMatch.firstNameScore < 0.75) {
		confidence = Math.min(confidence, 0.72)
		reason = 'first_name_weak'
	}

	if (departmentScore < 0.5) {
		confidence = Math.min(confidence, 0.68)
		reason = `${reason}+dept_weak`
	}

	if (nameMatch.score >= 0.95 && departmentScore >= 0.85) {
		confidence = Math.max(confidence, 0.94)
		reason = 'strong_name_dept'
	}

	return {
		confidence: Math.min(confidence, 1),
		nameScore: nameMatch.score,
		departmentScore,
		reason,
	}
}

export function scoreRmpMatch(
	bannerName: string,
	bannerDepartment: string,
	candidates: RmpProfessorCandidate[],
): RmpMatchResult | null {
	if (candidates.length === 0) return null

	const parsedBanner = parsePersonName(bannerName)
	if (!parsedBanner) return null

	const scored = candidates.map((professor) => ({
		professor,
		...scoreCandidate(bannerName, bannerDepartment, professor),
	}))

	scored.sort((a, b) => b.confidence - a.confidence)
	const best = scored[0]
	const runnerUp = scored[1]

	if (!best || best.confidence < RMP_MIN_CANDIDATE_THRESHOLD) return null

	if (
		runnerUp &&
		runnerUp.confidence >= RMP_MIN_CANDIDATE_THRESHOLD &&
		best.confidence - runnerUp.confidence < 0.08
	) {
		return {
			professor: best.professor,
			confidence: Math.min(best.confidence, 0.68),
			nameScore: best.nameScore,
			departmentScore: best.departmentScore,
			reason: 'ambiguous_top_candidates',
		}
	}

	return {
		professor: best.professor,
		confidence: best.confidence,
		nameScore: best.nameScore,
		departmentScore: best.departmentScore,
		reason: best.reason,
	}
}

export async function searchRmpProfessorCandidates(
	searchFn: (query: string) => Promise<RmpProfessorCandidate[]>,
	bannerName: string,
): Promise<RmpProfessorCandidate[]> {
	const queries = buildRmpSearchQueries(bannerName)
	const byId = new Map<string, RmpProfessorCandidate>()

	for (const query of queries) {
		const hits = await searchFn(query)
		for (const hit of hits) {
			byId.set(hit.rmpProfessorId, hit)
		}
		if (byId.size >= 8) break
	}

	return [...byId.values()]
}

export { buildRmpSearchQueries }
