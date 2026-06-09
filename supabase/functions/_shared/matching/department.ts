/** GT Banner department code → phrases seen on RMP school profiles. */
export const DEPARTMENT_ALIASES: Record<string, string[]> = {
	AE: ['aerospace engineering', 'aerospace'],
	AS: ['applied physiology', 'applied physiology and wellness'],
	APPH: ['applied physiology', 'health and kinesiology'],
	ARCH: ['architecture'],
	BC: ['building construction', 'building construction and'],
	BCP: ['building construction'],
	BIOL: ['biology', 'biological sciences'],
	BIOS: ['biology', 'biological sciences'],
	BMED: ['biomedical engineering'],
	BMEJ: ['biomedical engineering'],
	BMEM: ['biomedical engineering'],
	CEE: ['civil engineering', 'civil and environmental'],
	CHBE: ['chemical and biomolecular engineering', 'chemical engineering'],
	CHEM: ['chemistry', 'chemical'],
	CHIN: ['chinese'],
	COE: ['engineering', 'college of engineering'],
	CP: ['city planning', 'planning'],
	CS: ['computer science', 'computing', 'college of computing'],
	CSE: ['computer science', 'computing'],
	EAS: ['earth and atmospheric sciences', 'earth atmospheric'],
	ECE: [
		'electrical and computer engineering',
		'electrical engineering',
		'electrical & computer',
	],
	ECON: ['economics'],
	ENGL: ['english'],
	HTS: ['history technology and society', 'history, technology'],
	IMBA: ['business', 'management', 'mba'],
	ISYE: ['industrial and systems engineering', 'industrial engineering'],
	MATH: ['mathematics', 'math'],
	ME: ['mechanical engineering'],
	MGT: ['management', 'business'],
	MOT: ['management of technology'],
	PHYS: ['physics'],
	POL: ['political science', 'international affairs'],
	PSYC: ['psychology'],
	PUBP: ['public policy', 'policy studies'],
}

/** Cross-listed departments treated as equivalent for course/review matching. */
export const DEPARTMENT_EQUIVALENTS: Record<string, string[]> = {
	CS: ['CSE'],
	CSE: ['CS'],
	MATH: ['MATH'],
}

export function normalizeDepartmentCode(code: string): string {
	return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function expandDepartmentCodes(code: string): string[] {
	const normalized = normalizeDepartmentCode(code)
	const equivalents = DEPARTMENT_EQUIVALENTS[normalized] ?? []
	return [normalized, ...equivalents.map(normalizeDepartmentCode)]
}

export function scoreDepartmentMatch(
	bannerDept: string,
	rmpDepartment: string | null | undefined,
): number {
	if (!rmpDepartment?.trim()) return 0.15

	const banner = normalizeDepartmentCode(bannerDept)
	const rmpLower = rmpDepartment.toLowerCase().trim()
	const aliases = DEPARTMENT_ALIASES[banner] ?? [
		banner.toLowerCase(),
	]

	if (aliases.some((alias) => rmpLower.includes(alias))) return 1
	if (rmpLower.includes(banner.toLowerCase())) return 0.85

	for (const [code, codeAliases] of Object.entries(DEPARTMENT_ALIASES)) {
		if (code === banner) continue
		if (codeAliases.some((alias) => rmpLower.includes(alias))) return 0.1
	}

	return 0
}

export function departmentsEquivalent(
	left: string,
	right: string,
): boolean {
	const a = normalizeDepartmentCode(left)
	const b = normalizeDepartmentCode(right)
	if (a === b) return true
	return expandDepartmentCodes(a).includes(b)
}
