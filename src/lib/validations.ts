import { z } from 'zod'
import { DEPARTMENTS } from '@/utils/constants'
import { DAYS_OF_WEEK } from '@/utils/constants'
import { getTimeSlots } from '@/utils/time'
import { SEMESTERS } from '@/utils/constants'

const departmentSchema = z
	.string()
	.refine((v) => (DEPARTMENTS as readonly string[]).includes(v), 'Invalid department')
const daySchema = z
	.string()
	.refine((v) => (DAYS_OF_WEEK as readonly string[]).includes(v), 'Invalid day')
const timeSlots = getTimeSlots()
const timeSchema = z
	.string()
	.refine((v) => timeSlots.includes(v), 'Invalid time slot')
const semesterSchema = z
	.string()
	.refine((v) => (SEMESTERS as readonly string[]).includes(v), 'Invalid semester')

export const courseSchema = z.object({
	department: departmentSchema,
	course_number: z.coerce.number().int().positive(),
	course_name: z.string().min(1, 'Course name is required'),
	description: z.string().nullable(),
	credit_hours: z.coerce.number().int().min(1).max(99),
	difficulty_rating: z.coerce.number().int().min(1).max(5).nullable(),
	/** Discovery deck one-liner (optional). */
	deck_summary: z.string().max(500).nullable(),
	/** One red flag per line; replaced on save for this course. */
	red_flag_lines: z.string().max(8000),
})

export const instructorSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	department: departmentSchema,
	rating: z.coerce.number().min(0).max(5).nullable(),
	teaching_style: z.string().nullable(),
})

export const sectionSchema = z.object({
	course_id: z.string().uuid(),
	instructor_id: z.string().uuid(),
	section_code: z.string().min(1, 'Section code is required'),
	day_pattern: z
		.array(daySchema)
		.min(1, 'Select at least one day'),
	start_time: timeSchema,
	end_time: timeSchema,
	location: z.string().nullable(),
	crn: z.string().min(1, 'CRN is required'),
}).refine((data) => data.start_time < data.end_time, {
	message: 'End time must be after start time',
	path: ['end_time'],
})

export const prerequisiteSchema = z.object({
	course_id: z.string().uuid(),
	prerequisite_course_id: z.string().uuid(),
}).refine((data) => data.course_id !== data.prerequisite_course_id, {
	message: 'Course cannot be its own prerequisite',
	path: ['prerequisite_course_id'],
})

export const scheduleSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	semester: semesterSchema,
	year: z.coerce.number().int().min(2000).max(2100),
})

export const careerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
})

export const courseReviewSchema = z.object({
	rating: z.number().int().min(1).max(5),
	difficulty: z.number().int().min(1).max(5),
	comment: z.string().nullable(),
})

export const instructorReviewSchema = z.object({
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable(),
})

export type CourseFormValues = z.infer<typeof courseSchema>
export type InstructorFormValues = z.infer<typeof instructorSchema>
export type SectionFormValues = z.infer<typeof sectionSchema>
export type PrerequisiteFormValues = z.infer<typeof prerequisiteSchema>
export type ScheduleFormValues = z.infer<typeof scheduleSchema>
export type CareerFormValues = z.infer<typeof careerSchema>
export type CourseReviewFormValues = z.infer<typeof courseReviewSchema>
export type InstructorReviewFormValues = z.infer<typeof instructorReviewSchema>
