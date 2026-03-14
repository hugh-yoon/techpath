'use client'

import { useState, useMemo } from 'react'
import { DiscoveryDeck } from '@/components/discovery'
import { SubjectFilter } from '@/components/discovery/subject-filter'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses } from '@/hooks'
import { Course } from '@/types'

export default function DiscoveryPage() {
	const { data: coursesFromDb, isLoading: coursesLoading } = useCourses()
	const [addedCourses, setAddedCourses] = useState<string[]>([])
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

	// Discovery deck accepts optional cost/gradeDistribution; DB courses don't have them
	const allCourses = (coursesFromDb ?? []) as (Course & {
		cost?: string
		gradeDistribution?: Record<string, number>
	})[]

	const departments = useMemo(() => {
		const set = new Set<string>()
		allCourses.forEach((c) => set.add(c.department))
		return Array.from(set).sort()
	}, [allCourses])

	const courses = useMemo(() => {
		if (selectedSubjects.length === 0) return allCourses
		return allCourses.filter((c) => selectedSubjects.includes(c.department))
	}, [allCourses, selectedSubjects])

	const handleAddCourse = (course: Course) => {
		setAddedCourses((prev) => [...prev, course.id])
	}

	const handleViewDetails = (course: Course) => {
		window.location.href = `/course/${course.id}`
	}

	return (
		<div className="min-h-screen bg-gt-white">
			<PageHeader
				title="Discovery Deck"
				subtitle="Discover new courses and find classes that match your interests"
				homeHref="/"
			/>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="grid grid-cols-3 gap-8">
					{/* Deck */}
					<div className="col-span-2">
						<div className="rounded-2xl bg-gt-diploma border-2 border-gt-navy/10 p-8">
							{coursesLoading ? (
								<div className="flex h-96 flex-col items-center justify-center gap-4 p-6" aria-hidden>
									<Skeleton className="h-64 w-full max-w-sm rounded-2xl" />
									<div className="flex gap-2">
										<Skeleton className="h-10 w-24 rounded-lg" />
										<Skeleton className="h-10 w-24 rounded-lg" />
									</div>
								</div>
							) : courses.length > 0 ? (
								<DiscoveryDeck
									courses={courses}
									onAddCourse={handleAddCourse}
									onViewDetails={handleViewDetails}
								/>
							) : (
								<div className="flex h-96 items-center justify-center">
									<p className="text-gt-gray-matter">No courses in the catalog yet.</p>
								</div>
							)}
						</div>
					</div>

					{/* Sidebar: Added Courses */}
					<div className="space-y-4">
						<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4">
							<h3 className="font-bold text-gt-navy mb-4">
								Added ({addedCourses.length})
							</h3>
							{addedCourses.length === 0 ? (
								<p className="text-sm text-gt-gray-matter">
									Swipe right to add courses to your list
								</p>
							) : (
								<div className="space-y-2">
									{addedCourses.map((courseId) => {
										const course = courses.find((c) => c.id === courseId)
										return course ? (
											<div
												key={courseId}
												className="text-sm rounded-lg bg-gt-tech-gold/20 p-2 text-gt-navy font-medium"
											>
												{course.department} {course.course_number}
											</div>
										) : null
									})}
								</div>
							)}
						</div>

						{/* Stats */}
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-xl bg-gt-navy p-4 text-center">
								<div className="text-2xl font-bold text-gt-tech-gold">
									{courses.length}
								</div>
								<div className="text-xs text-gt-white/60 mt-1">Total Courses</div>
							</div>
							<div className="rounded-xl bg-gt-tech-gold p-4 text-center">
								<div className="text-2xl font-bold text-gt-navy">
									{Math.round((addedCourses.length / Math.max(courses.length, 1)) * 100)}%
								</div>
								<div className="text-xs text-gt-navy/60 mt-1">Added</div>
							</div>
						</div>

						{/* Subject filter */}
						{departments.length > 0 && (
							<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-4">
								<h3 className="font-bold text-gt-navy mb-2">Subjects</h3>
								<SubjectFilter
									departments={departments}
									selected={selectedSubjects}
									onChange={setSelectedSubjects}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
