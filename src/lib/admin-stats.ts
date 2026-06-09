import { supabase } from '@/lib/supabaseClient'
import { applyActiveSectionTermFilter } from '@/lib/active-term-ids'
import { getCachedActiveTermIds } from '@/lib/active-term-cache'

export interface AdminDashboardStats {
	loadedCourseCount: number
	activeSectionCount: number
	scheduledInstructorCount: number
	reviewCount: number
	courseReviewCount: number
	instructorReviewCount: number
	totalCourseCatalogCount: number
	totalInstructorRecords: number
	bannerSectionCount: number
	seedSectionCount: number
	orphanInstructorCount: number
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
	const activeTermIds = await getCachedActiveTermIds()

	let sectionsQuery = supabase
		.from('sections')
		.select('course_id, instructor_id')
		.eq('is_active', true)
	sectionsQuery = applyActiveSectionTermFilter(sectionsQuery, activeTermIds)

	const [
		sectionsResult,
		courseReviewsResult,
		instructorReviewsResult,
		allCoursesResult,
		allInstructorsResult,
		bannerSectionsResult,
		seedSectionsResult,
	] = await Promise.all([
		sectionsQuery,
		supabase
			.from('course_reviews')
			.select('*', { count: 'exact', head: true }),
		supabase
			.from('instructor_reviews')
			.select('*', { count: 'exact', head: true }),
		supabase.from('courses').select('*', { count: 'exact', head: true }),
		supabase.from('instructors').select('*', { count: 'exact', head: true }),
		supabase
			.from('sections')
			.select('*', { count: 'exact', head: true })
			.eq('is_active', true)
			.not('term_id', 'is', null),
		supabase
			.from('sections')
			.select('*', { count: 'exact', head: true })
			.eq('is_active', true)
			.is('term_id', null),
	])

	if (sectionsResult.error) throw sectionsResult.error
	if (courseReviewsResult.error) throw courseReviewsResult.error
	if (instructorReviewsResult.error) throw instructorReviewsResult.error
	if (allCoursesResult.error) throw allCoursesResult.error
	if (allInstructorsResult.error) throw allInstructorsResult.error
	if (bannerSectionsResult.error) throw bannerSectionsResult.error
	if (seedSectionsResult.error) throw seedSectionsResult.error

	const courseIds = new Set<string>()
	const instructorIds = new Set<string>()
	for (const row of sectionsResult.data ?? []) {
		if (row.course_id) courseIds.add(row.course_id as string)
		if (row.instructor_id) instructorIds.add(row.instructor_id as string)
	}

	const courseReviewCount = courseReviewsResult.count ?? 0
	const instructorReviewCount = instructorReviewsResult.count ?? 0

	const orphanInstructorCount = Math.max(
		0,
		(allInstructorsResult.count ?? 0) - instructorIds.size,
	)

	return {
		loadedCourseCount: courseIds.size,
		activeSectionCount: sectionsResult.data?.length ?? 0,
		scheduledInstructorCount: instructorIds.size,
		reviewCount: courseReviewCount + instructorReviewCount,
		courseReviewCount,
		instructorReviewCount,
		totalCourseCatalogCount: allCoursesResult.count ?? 0,
		totalInstructorRecords: allInstructorsResult.count ?? 0,
		bannerSectionCount: bannerSectionsResult.count ?? 0,
		seedSectionCount: seedSectionsResult.count ?? 0,
		orphanInstructorCount,
	}
}
