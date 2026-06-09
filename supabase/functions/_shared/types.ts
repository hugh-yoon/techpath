export type Semester = 'Fall' | 'Spring' | 'Summer'

export type ReviewSource = 'student' | 'rmp'

export interface BannerTerm {
	bannerTermCode: string
	semester: Semester
	year: number
	description: string
}

export interface BannerSectionRow {
	bannerSectionId: string
	bannerTermCode: string
	department: string
	courseNumber: number
	courseTitle: string
	creditHours: number
	sectionCode: string
	crn: string
	instructorName: string
	scheduleType: string | null
	campus: string | null
	location: string | null
	contactHours: number | null
	dayPattern: string[]
	startTime: string
	endTime: string
	linkedBannerSectionId: string | null
}

export interface RmpProfessorSummary {
	rmpProfessorId: string
	rmpNodeId?: string
	name: string
	firstName?: string
	lastName?: string
	department: string | null
	quality: number
	difficulty: number
	wouldTakeAgain: number | null
	ratingCount: number
}

export interface RmpReviewRow {
	externalReviewId: string
	rating: number
	difficulty: number | null
	wouldTakeAgain: boolean | null
	comment: string | null
	courseContext: string | null
	termContext: string | null
}

export interface RmpMatchResult {
	professor: RmpProfessorSummary
	confidence: number
}
