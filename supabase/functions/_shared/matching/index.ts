export {
	parsePersonName,
	normalizeInstructorName,
	normalizeNameToken,
	scorePersonNameMatch,
	buildRmpSearchQueries,
	type ParsedPersonName,
	type PersonNameMatchScore,
} from './person-name.ts'

export {
	DEPARTMENT_ALIASES,
	DEPARTMENT_EQUIVALENTS,
	normalizeDepartmentCode,
	expandDepartmentCodes,
	scoreDepartmentMatch,
	departmentsEquivalent,
} from './department.ts'

export {
	extractCourseCodes,
	normalizeCourseCode,
	scoreCourseContextMatch,
	courseContextMatchesCourse,
	COURSE_REVIEW_MATCH_THRESHOLD,
	type ParsedCourseCode,
	type CourseMatchResult,
} from './course-code.ts'

export {
	scoreRmpMatch,
	searchRmpProfessorCandidates,
	RMP_AUTO_MATCH_THRESHOLD,
	RMP_MIN_CANDIDATE_THRESHOLD,
	type RmpProfessorCandidate,
	type RmpMatchResult,
} from './rmp-instructor.ts'
