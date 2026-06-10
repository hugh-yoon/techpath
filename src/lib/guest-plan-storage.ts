'use client'

import type {
	Career,
	CareerWithSchedules,
	Schedule,
	ScheduleWithSections,
	Semester,
} from '@/types'

const STORAGE_KEY = 'techplan-guest-plans'

interface GuestScheduleSection {
	id: string
	section_id: string
}

interface GuestCareerSchedule {
	id: string
	career_id: string
	schedule_id: string
	semester_order: number
}

interface GuestPlanData {
	schedules: Array<Schedule & { sections: GuestScheduleSection[] }>
	careers: Career[]
	careerSchedules: GuestCareerSchedule[]
}

function createId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID()
	}
	return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readGuestData(): GuestPlanData {
	if (typeof sessionStorage === 'undefined') {
		return { schedules: [], careers: [], careerSchedules: [] }
	}
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) return { schedules: [], careers: [], careerSchedules: [] }
		const parsed = JSON.parse(raw) as Partial<GuestPlanData>
		return {
			schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
			careers: Array.isArray(parsed.careers) ? parsed.careers : [],
			careerSchedules: Array.isArray(parsed.careerSchedules)
				? parsed.careerSchedules
				: [],
		}
	} catch {
		return { schedules: [], careers: [], careerSchedules: [] }
	}
}

function writeGuestData(data: GuestPlanData) {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	} catch {
		// sessionStorage unavailable
	}
}

function notifyGuestChange() {
	if (typeof window === 'undefined') return
	window.dispatchEvent(new Event('guest-plan-change'))
}

export function subscribeGuestPlanChanges(listener: () => void) {
	if (typeof window === 'undefined') return () => {}
	window.addEventListener('guest-plan-change', listener)
	return () => window.removeEventListener('guest-plan-change', listener)
}

export function listGuestSchedules(): Schedule[] {
	return readGuestData().schedules.map(({ sections: _sections, ...schedule }) => schedule)
}

export function getGuestSchedule(id: string): GuestPlanData['schedules'][number] | null {
	return readGuestData().schedules.find((schedule) => schedule.id === id) ?? null
}

export function createGuestSchedule(input: {
	name: string
	semester: Semester
	year: number
}): Schedule {
	const data = readGuestData()
	const schedule = {
		id: createId(),
		name: input.name,
		semester: input.semester,
		year: input.year,
		sections: [],
	}
	data.schedules.push(schedule)
	writeGuestData(data)
	notifyGuestChange()
	return {
		id: schedule.id,
		name: schedule.name,
		semester: schedule.semester,
		year: schedule.year,
	}
}

export function updateGuestSchedule(
	id: string,
	updates: Partial<Pick<Schedule, 'name' | 'semester' | 'year'>>,
) {
	const data = readGuestData()
	const index = data.schedules.findIndex((schedule) => schedule.id === id)
	if (index < 0) return
	data.schedules[index] = { ...data.schedules[index], ...updates }
	writeGuestData(data)
	notifyGuestChange()
}

export function deleteGuestSchedule(id: string) {
	const data = readGuestData()
	data.schedules = data.schedules.filter((schedule) => schedule.id !== id)
	data.careerSchedules = data.careerSchedules.filter(
		(cs) => cs.schedule_id !== id,
	)
	writeGuestData(data)
	notifyGuestChange()
}

export function addGuestScheduleSection(
	scheduleId: string,
	sectionId: string,
): { id: string } | null {
	const data = readGuestData()
	const schedule = data.schedules.find((row) => row.id === scheduleId)
	if (!schedule) return null
	if (schedule.sections.some((row) => row.section_id === sectionId)) {
		return null
	}
	const row = { id: createId(), section_id: sectionId }
	schedule.sections.push(row)
	writeGuestData(data)
	notifyGuestChange()
	return row
}

export function removeGuestScheduleSection(scheduleSectionId: string) {
	const data = readGuestData()
	for (const schedule of data.schedules) {
		schedule.sections = schedule.sections.filter(
			(row) => row.id !== scheduleSectionId,
		)
	}
	writeGuestData(data)
	notifyGuestChange()
}

export function moveGuestScheduleSection(
	scheduleSectionId: string,
	targetScheduleId: string,
) {
	const data = readGuestData()
	let moved: GuestScheduleSection | null = null
	for (const schedule of data.schedules) {
		const index = schedule.sections.findIndex((row) => row.id === scheduleSectionId)
		if (index >= 0) {
			moved = schedule.sections[index]
			schedule.sections.splice(index, 1)
			break
		}
	}
	if (!moved) return
	const target = data.schedules.find((schedule) => schedule.id === targetScheduleId)
	if (!target) return
	target.sections.push(moved)
	writeGuestData(data)
	notifyGuestChange()
}

export function listGuestCareers(): Career[] {
	return readGuestData().careers
}

export function createGuestCareer(name: string): Career {
	const data = readGuestData()
	const career = { id: createId(), name }
	data.careers.push(career)
	writeGuestData(data)
	notifyGuestChange()
	return career
}

export function updateGuestCareer(id: string, name: string) {
	const data = readGuestData()
	const index = data.careers.findIndex((career) => career.id === id)
	if (index < 0) return
	data.careers[index] = { ...data.careers[index], name }
	writeGuestData(data)
	notifyGuestChange()
}

export function deleteGuestCareer(id: string) {
	const data = readGuestData()
	data.careers = data.careers.filter((career) => career.id !== id)
	data.careerSchedules = data.careerSchedules.filter((cs) => cs.career_id !== id)
	writeGuestData(data)
	notifyGuestChange()
}

export function addGuestCareerSchedule(
	careerId: string,
	scheduleId: string,
	semesterOrder: number,
) {
	const data = readGuestData()
	const row = {
		id: createId(),
		career_id: careerId,
		schedule_id: scheduleId,
		semester_order: semesterOrder,
	}
	data.careerSchedules.push(row)
	writeGuestData(data)
	notifyGuestChange()
	return row
}

export function updateGuestCareerScheduleOrder(
	careerScheduleId: string,
	semesterOrder: number,
) {
	const data = readGuestData()
	const row = data.careerSchedules.find((cs) => cs.id === careerScheduleId)
	if (!row) return
	row.semester_order = semesterOrder
	writeGuestData(data)
	notifyGuestChange()
}

export function getGuestCareerSchedules(careerId: string): GuestCareerSchedule[] {
	return readGuestData()
		.careerSchedules
		.filter((cs) => cs.career_id === careerId)
		.sort((a, b) => a.semester_order - b.semester_order)
}

export function getGuestScheduleSectionIds(
	scheduleId: string,
): GuestScheduleSection[] {
	return getGuestSchedule(scheduleId)?.sections ?? []
}

export function buildGuestScheduleWithSections(
	schedule: GuestPlanData['schedules'][number],
	sectionMap: Map<
		string,
		NonNullable<ScheduleWithSections['schedule_sections']>[number]['section']
	>,
): ScheduleWithSections {
	return {
		id: schedule.id,
		name: schedule.name,
		semester: schedule.semester,
		year: schedule.year,
		schedule_sections: schedule.sections
			.map((row) => {
				const section = sectionMap.get(row.section_id)
				if (!section) return null
				return {
					id: row.id,
					section_id: row.section_id,
					section,
				}
			})
			.filter((row): row is NonNullable<typeof row> => row !== null),
	}
}

export function buildGuestCareerWithSchedules(
	career: Career,
	careerSchedules: GuestCareerSchedule[],
	scheduleMap: Map<string, ScheduleWithSections>,
): CareerWithSchedules {
	return {
		...career,
		career_schedules: careerSchedules.map((cs) => ({
			id: cs.id,
			schedule_id: cs.schedule_id,
			semester_order: cs.semester_order,
			schedule: scheduleMap.get(cs.schedule_id) ?? null,
		})),
	}
}
