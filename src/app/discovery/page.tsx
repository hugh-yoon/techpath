'use client'

import { useEffect, useMemo, useState } from 'react'
import { DiscoveryDeck } from '@/components/discovery'
import { SubjectFilter } from '@/components/discovery/subject-filter'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses, useSchedule, useSchedules } from '@/hooks'
import { Course } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { useActionToast } from '@/components/ui/action-toast'

export default function DiscoveryPage() {
	const { data: coursesFromDb, isLoading: coursesLoading } = useCourses()
	const { data: schedules } = useSchedules()
	const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
	const { data: selectedSchedule, refetch: refetchSelectedSchedule } =
		useSchedule(selectedScheduleId)
	const { notify } = useActionToast()

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

	useEffect(() => {
		if (!selectedScheduleId && schedules.length > 0) {
			setSelectedScheduleId(schedules[0].id)
		}
	}, [selectedScheduleId, schedules])

	const handleAddCourse = async (course: Course) => {
		if (!selectedScheduleId) {
			notify('Select a schedule before adding classes', 'info')
			return
		}

		const { data: section, error: sectionError } = await supabase
			.from('sections')
			.select('id, section_code')
			.eq('course_id', course.id)
			.order('section_code')
			.limit(1)
			.maybeSingle()

		if (sectionError || !section) {
			notify('No available section found for this course', 'error')
			return
		}

		const { error } = await supabase.from('schedule_sections').insert({
			schedule_id: selectedScheduleId,
			section_id: section.id,
		})

		if (error) {
			if (error.code === '23505') {
				notify('That class is already in this schedule', 'info')
				return
			}
			notify('Failed to add class to schedule', 'error')
			return
		}

		await refetchSelectedSchedule()
		notify('Class added to schedule')
	}

	const handleViewDetails = (course: Course) => {
		window.location.href = `/course/${course.id}`
	}

	const handleRemoveCourse = async (scheduleSectionId: string) => {
		const { error } = await supabase
			.from('schedule_sections')
			.delete()
			.eq('id', scheduleSectionId)

		if (error) {
			notify('Failed to remove class from schedule', 'error')
			return
		}

		await refetchSelectedSchedule()
		notify('Class removed from schedule')
	}

	const addedSections = selectedSchedule?.schedule_sections ?? []

	return (
		<div className="min-h-screen bg-gt-white">
			<PageHeader
				title="Discovery Deck"
				subtitle="Discover new courses and find classes that match your interests"
				homeHref="/"
			/>

			{/* Main content */}
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<div className="grid grid-cols-3 gap-5 sm:gap-6">
					{/* Deck */}
					<div className="col-span-2">
						<div className="rounded-2xl border-2 border-gt-navy/10 bg-gt-diploma p-4 sm:p-5">
							{coursesLoading ? (
								<div
									className="flex h-[min(28rem,72vh)] flex-col items-center justify-center gap-3 p-4"
									aria-hidden
								>
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
								Added ({addedSections.length})
							</h3>
							<div className="mb-3">
								<Select
									value={selectedScheduleId ?? ''}
									onValueChange={(value) =>
										setSelectedScheduleId(value || null)
									}
								>
									<SelectTrigger aria-label="Select schedule for added classes">
										<SelectValue placeholder="Select a schedule" />
									</SelectTrigger>
									<SelectContent>
										{schedules.map((schedule) => (
											<SelectItem key={schedule.id} value={schedule.id}>
												{schedule.name} - {schedule.semester} {schedule.year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{!selectedScheduleId ? (
								<p className="text-sm text-gt-gray-matter">
									Choose a schedule to add classes from the deck
								</p>
							) : addedSections.length === 0 ? (
								<p className="text-sm text-gt-gray-matter">
									No classes in this schedule yet
								</p>
							) : (
								<div className="space-y-2">
									{addedSections.map((scheduleSection) => {
										const course = scheduleSection.section?.course
										if (!course) return null
										return (
											<div
												key={scheduleSection.id}
												className="flex items-start justify-between gap-2 rounded-lg bg-gt-tech-gold/20 p-2 text-gt-navy"
											>
												<div className="min-w-0">
													<p className="text-sm font-medium">
														{course.department} {course.course_number}
													</p>
													<p className="truncate text-xs text-gt-gray-matter">
														{course.course_name}
													</p>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveCourse(scheduleSection.id)}
													className="rounded p-1 text-gt-navy/70 transition-colors hover:bg-gt-white/60 hover:text-red-700"
													aria-label="Remove class from schedule"
												>
													<X className="h-4 w-4" aria-hidden />
												</button>
											</div>
										)
									})}
								</div>
							)}
						</div>

						<div className="rounded-xl bg-gt-navy p-4 text-center">
							<div className="text-2xl font-bold text-gt-tech-gold">{courses.length}</div>
							<div className="mt-1 text-xs text-gt-white/70">Courses in view</div>
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
