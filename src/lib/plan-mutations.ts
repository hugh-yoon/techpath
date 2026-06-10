'use client'

import { supabase } from '@/lib/supabaseClient'
import {
	addGuestCareerSchedule,
	addGuestScheduleSection,
	createGuestCareer,
	createGuestSchedule,
	deleteGuestCareer,
	deleteGuestSchedule,
	moveGuestScheduleSection,
	removeGuestScheduleSection,
	updateGuestCareer,
	updateGuestCareerScheduleOrder,
	updateGuestSchedule,
} from '@/lib/guest-plan-storage'
import type { Career, Schedule, Semester } from '@/types'

export async function createSchedule(
	userId: string | null,
	input: { name: string; semester: Semester; year: number },
): Promise<{ data: Schedule | null; error: string | null }> {
	if (!userId) {
		return { data: createGuestSchedule(input), error: null }
	}

	const { data, error } = await supabase
		.from('schedules')
		.insert({ ...input, user_id: userId })
		.select('id, name, semester, year')
		.single()

	if (error) return { data: null, error: error.message }
	return { data: data as Schedule, error: null }
}

export async function updateScheduleName(
	userId: string | null,
	scheduleId: string,
	name: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		updateGuestSchedule(scheduleId, { name })
		return { error: null }
	}

	const { error } = await supabase
		.from('schedules')
		.update({ name })
		.eq('id', scheduleId)

	return { error: error?.message ?? null }
}

export async function deleteSchedule(
	userId: string | null,
	scheduleId: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		deleteGuestSchedule(scheduleId)
		return { error: null }
	}

	const { error } = await supabase.from('schedules').delete().eq('id', scheduleId)
	return { error: error?.message ?? null }
}

export async function addSectionToSchedule(
	userId: string | null,
	scheduleId: string,
	sectionId: string,
): Promise<{ error: string | null; duplicate?: boolean }> {
	if (!userId) {
		const row = addGuestScheduleSection(scheduleId, sectionId)
		if (!row) return { error: null, duplicate: true }
		return { error: null }
	}

	const { error } = await supabase.from('schedule_sections').insert({
		schedule_id: scheduleId,
		section_id: sectionId,
	})

	if (error?.code === '23505') {
		return { error: null, duplicate: true }
	}

	return { error: error?.message ?? null }
}

export async function removeSectionFromSchedule(
	userId: string | null,
	scheduleSectionId: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		removeGuestScheduleSection(scheduleSectionId)
		return { error: null }
	}

	const { error } = await supabase
		.from('schedule_sections')
		.delete()
		.eq('id', scheduleSectionId)

	return { error: error?.message ?? null }
}

export async function moveSectionBetweenSchedules(
	userId: string | null,
	scheduleSectionId: string,
	targetScheduleId: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		moveGuestScheduleSection(scheduleSectionId, targetScheduleId)
		return { error: null }
	}

	const { error } = await supabase
		.from('schedule_sections')
		.update({ schedule_id: targetScheduleId })
		.eq('id', scheduleSectionId)

	return { error: error?.message ?? null }
}

export async function createCareer(
	userId: string | null,
	name: string,
): Promise<{ data: Career | null; error: string | null }> {
	if (!userId) {
		return { data: createGuestCareer(name), error: null }
	}

	const { data, error } = await supabase
		.from('careers')
		.insert({ name, user_id: userId })
		.select('id, name')
		.single()

	if (error) return { data: null, error: error.message }
	return { data: data as Career, error: null }
}

export async function updateCareerName(
	userId: string | null,
	careerId: string,
	name: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		updateGuestCareer(careerId, name)
		return { error: null }
	}

	const { error } = await supabase
		.from('careers')
		.update({ name })
		.eq('id', careerId)

	return { error: error?.message ?? null }
}

export async function deleteCareer(
	userId: string | null,
	careerId: string,
): Promise<{ error: string | null }> {
	if (!userId) {
		deleteGuestCareer(careerId)
		return { error: null }
	}

	const { error } = await supabase.from('careers').delete().eq('id', careerId)
	return { error: error?.message ?? null }
}

export async function addScheduleToCareer(
	userId: string | null,
	careerId: string,
	scheduleId: string,
	semesterOrder: number,
): Promise<{ error: string | null }> {
	if (!userId) {
		addGuestCareerSchedule(careerId, scheduleId, semesterOrder)
		return { error: null }
	}

	const { error } = await supabase.from('career_schedules').insert({
		career_id: careerId,
		schedule_id: scheduleId,
		semester_order: semesterOrder,
	})

	return { error: error?.message ?? null }
}

export async function updateCareerScheduleOrder(
	userId: string | null,
	careerScheduleId: string,
	semesterOrder: number,
): Promise<{ error: string | null }> {
	if (!userId) {
		updateGuestCareerScheduleOrder(careerScheduleId, semesterOrder)
		return { error: null }
	}

	const { error } = await supabase
		.from('career_schedules')
		.update({ semester_order: semesterOrder })
		.eq('id', careerScheduleId)

	return { error: error?.message ?? null }
}
