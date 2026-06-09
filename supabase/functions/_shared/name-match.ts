import { normalizeInstructorName } from './normalize.ts'
import type { RmpProfessorSummary } from './types.ts'

const DEPARTMENT_ALIASES: Record<string, string[]> = {
	CS: ['computer science', 'computing'],
	MATH: ['mathematics', 'math'],
	ECE: ['electrical engineering', 'electrical and computer engineering'],
	ME: ['mechanical engineering'],
	ISYE: ['industrial engineering'],
}

function departmentScore(
	bannerDept: string,
	rmpDepartment: string | null,
): number {
	if (!rmpDepartment) return 0.2
	const banner = bannerDept.toUpperCase()
	const rmpLower = rmpDepartment.toLowerCase()
	const aliases = DEPARTMENT_ALIASES[banner] ?? [banner.toLowerCase()]
	if (aliases.some((alias) => rmpLower.includes(alias))) return 1
	if (rmpLower.includes(banner.toLowerCase())) return 0.8
	return 0
}

export function scoreRmpMatch(
	bannerName: string,
	bannerDepartment: string,
	candidates: RmpProfessorSummary[],
): { professor: RmpProfessorSummary; confidence: number } | null {
	if (candidates.length === 0) return null

	const normalized = normalizeInstructorName(bannerName)
	const exact = candidates.filter(
		(c) => normalizeInstructorName(c.name) === normalized,
	)

	const pool = exact.length > 0 ? exact : candidates
	let best: RmpProfessorSummary | null = null
	let bestScore = 0

	for (const candidate of pool) {
		const nameScore = normalizeInstructorName(candidate.name) === normalized
			? 1
			: 0.5
		const dept = departmentScore(bannerDepartment, candidate.department)
		const ratingBoost = candidate.ratingCount > 0 ? 0.05 : 0
		const score = nameScore * 0.7 + dept * 0.25 + ratingBoost
		if (score > bestScore) {
			bestScore = score
			best = candidate
		}
	}

	if (!best || bestScore < 0.55) return null
	return { professor: best, confidence: Math.min(bestScore, 1) }
}
