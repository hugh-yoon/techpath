export type DayOfWeek =
	| 'Monday'
	| 'Tuesday'
	| 'Wednesday'
	| 'Thursday'
	| 'Friday'

export type Semester = 'Fall' | 'Spring' | 'Summer'

export interface CourseRedFlag {
	id: string
	body: string
	sort_order: number
}

export interface Course {
	id: string
	department: string
	course_number: number
	course_name: string
	description: string | null
	credit_hours: number
	difficulty_rating: number | null
	/** Short hook for discovery deck (optional until DB migration). */
	deck_summary?: string | null
	course_red_flags?: CourseRedFlag[] | null
}

export type ReviewSource = 'student' | 'rmp'

export interface Term {
	id: string
	semester: Semester
	year: number
	banner_term_code: string
	is_current: boolean
	synced_at: string | null
}

export interface Instructor {
	id: string
	name: string
	department: string
	rating: number | null
	teaching_style: string | null
	name_normalized?: string | null
	rmp_professor_id?: string | null
	rmp_quality?: number | null
	rmp_difficulty?: number | null
	rmp_would_take_again?: number | null
	rmp_rating_count?: number | null
	rmp_department?: string | null
	rmp_synced_at?: string | null
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
	term_id?: string | null
	schedule_type?: string | null
	campus?: string | null
	contact_hours?: number | null
	linked_section_id?: string | null
	banner_section_id?: string | null
	is_active?: boolean
	synced_at?: string | null
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
	source?: ReviewSource
	external_review_id?: string | null
	difficulty?: number | null
	would_take_again?: boolean | null
	course_context?: string | null
	term_context?: string | null
	scraped_at?: string | null
}

export interface InstructorRmpCandidate {
	id: string
	instructor_id: string
	rmp_professor_id: string
	rmp_name: string
	rmp_department: string | null
	match_confidence: number
	status: 'auto_matched' | 'pending' | 'approved' | 'rejected'
	created_at: string
}

export interface SectionReview {
	id: string
	section_id: string
	rating: number
	difficulty: number
	comment: string | null
}

export interface SyncJob {
	id: string
	job_type: 'banner_full' | 'rmp_daily'
	status: 'running' | 'success' | 'failed'
	started_at: string
	completed_at: string | null
	records_upserted: number
	records_failed: number
	error_summary: string | null
	metadata: Record<string, unknown>
}
