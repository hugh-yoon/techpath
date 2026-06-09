export {
	parsePersonName,
	normalizeInstructorName,
	normalizeNameToken,
	scorePersonNameMatch,
	buildRmpSearchQueries,
	type ParsedPersonName,
	type PersonNameMatchScore,
} from './person-name'

export {
	DEPARTMENT_ALIASES,
	DEPARTMENT_EQUIVALENTS,
	normalizeDepartmentCode,
	expandDepartmentCodes,
	scoreDepartmentMatch,
	departmentsEquivalent,
} from './department'

export {
	extractCourseCodes,
	normalizeCourseCode,
	scoreCourseContextMatch,
	courseContextMatchesCourse,
	COURSE_REVIEW_MATCH_THRESHOLD,
	type ParsedCourseCode,
	type CourseMatchResult,
} from './course-code'

export {
	scoreRmpMatch,
	searchRmpProfessorCandidates,
	RMP_AUTO_MATCH_THRESHOLD,
	RMP_MIN_CANDIDATE_THRESHOLD,
	type RmpProfessorCandidate,
	type RmpMatchResult,
} from './rmp-instructor'
