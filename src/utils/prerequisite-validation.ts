import type { CareerWithSchedules } from '@/types'

/**
 * Returns set of course IDs that violate prerequisite order in the career.
 * A course violates if any of its prerequisites are not in an earlier semester.
 */
export function getPrerequisiteViolations(
	career: CareerWithSchedules | null,
	prereqByCourse: Map<string, string[]>,
): Set<string> {
	const violations = new Set<string>()
	if (!career?.career_schedules) return violations

	const courseIdsByOrder: string[] = []
	for (const cs of career.career_schedules.sort(
		(a, b) => a.semester_order - b.semester_order,
	)) {
		const schedule = cs.schedule as { schedule_sections?: Array<{ section?: { course_id?: string } }> }
		const sections = schedule?.schedule_sections ?? []
		for (const ss of sections) {
			const courseId = ss.section?.course_id
			if (courseId) courseIdsByOrder.push(courseId)
		}
	}

	const courseToOrder = new Map<string, number>()
	courseIdsByOrder.forEach((id, index) => {
		if (!courseToOrder.has(id)) courseToOrder.set(id, index)
	})

	for (const cs of career.career_schedules.sort(
		(a, b) => a.semester_order - b.semester_order,
	)) {
		const schedule = cs.schedule as { schedule_sections?: Array<{ section?: { course_id?: string } }> }
		const sections = schedule?.schedule_sections ?? []
		for (const ss of sections) {
			const courseId = ss.section?.course_id
			if (!courseId) continue
			const prereqs = prereqByCourse.get(courseId) ?? []
			const courseOrder = courseToOrder.get(courseId) ?? 0
			for (const prereqId of prereqs) {
				const prereqOrder = courseToOrder.get(prereqId)
				if (prereqOrder === undefined || prereqOrder >= courseOrder) {
					violations.add(courseId)
					break
				}
			}
		}
	}
	return violations
}

/**
 * Find semester orders (in the career) where the given course would satisfy prerequisites.
 * Returns array of semester_order values that are valid drop targets.
 */
export function getEligibleSemesterOrders(
	career: CareerWithSchedules | null,
	courseId: string,
	prereqIds: string[],
): number[] {
	if (!career?.career_schedules?.length) return []
	const sorted = [...career.career_schedules].sort(
		(a, b) => a.semester_order - b.semester_order,
	)
	const courseIdsBeforeOrder = new Map<number, Set<string>>()
	let accumulated = new Set<string>()
	for (const cs of sorted) {
		courseIdsBeforeOrder.set(cs.semester_order, new Set(accumulated))
		const schedule = cs.schedule as { schedule_sections?: Array<{ section?: { course_id?: string } }> }
		const sections = schedule?.schedule_sections ?? []
		for (const ss of sections) {
			const cid = ss.section?.course_id
			if (cid) accumulated.add(cid)
		}
	}
	const eligible: number[] = []
	for (const cs of sorted) {
		const before = courseIdsBeforeOrder.get(cs.semester_order) ?? new Set()
		const allPrereqsSatisfied = prereqIds.every((pid) => before.has(pid))
		if (allPrereqsSatisfied) eligible.push(cs.semester_order)
	}
	return eligible
}
