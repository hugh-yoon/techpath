export type DayOfWeek =
	| 'Monday'
	| 'Tuesday'
	| 'Wednesday'
	| 'Thursday'
	| 'Friday'

export type Semester = 'Fall' | 'Spring' | 'Summer'

export interface Course {
	id: string
	department: string
	course_number: number
	course_name: string
	description: string | null
	credit_hours: number
	difficulty_rating: number | null
}

export interface Instructor {
	id: string
	name: string
	department: string
	rating: number | null
	teaching_style: string | null
}

export interface Section {
	id: string
	course_id: string
	instructor_id: string
	section_code: string
	day_pattern: DayOfWeek[]
	start_time: string
	end_time: string
	location: string | null
	crn: string
}

export interface SectionWithRelations extends Section {
	course?: Course | null
	instructor?: Instructor | null
}

export interface CoursePrerequisite {
	id: string
	course_id: string
	prerequisite_course_id: string
}

export interface Schedule {
	id: string
	name: string
	semester: Semester
	year: number
}

export interface ScheduleSection {
	id: string
	schedule_id: string
	section_id: string
}

export interface ScheduleWithSections extends Schedule {
	schedule_sections?: Array<{
		id: string
		section_id: string
		section: SectionWithRelations
	}> | null
}

export interface Career {
	id: string
	name: string
}

export interface CareerSchedule {
	id: string
	career_id: string
	schedule_id: string
	semester_order: number
}

export interface CareerWithSchedules extends Career {
	career_schedules?: Array<{
		id: string
		schedule_id: string
		semester_order: number
		schedule: ScheduleWithSections
	}> | null
}

export interface CourseReview {
	id: string
	course_id: string
	rating: number
	difficulty: number
	comment: string | null
}

export interface InstructorReview {
	id: string
	instructor_id: string
	rating: number
	comment: string | null
}

export interface SectionReview {
	id: string
	section_id: string
	rating: number
	difficulty: number
	comment: string | null
}
