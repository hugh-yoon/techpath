'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { SemesterSchedule } from '@/components/path-builder'
import { useCourses, useAllSchedulesWithSections, usePrerequisiteMap } from '@/hooks'
import { formatTimeDisplay } from '@/utils/time'
import { Course } from '@/types'
import { Calendar, Grid3x3, X } from 'lucide-react'

interface ScheduleEntry {
	courseId: string
	course: Course
	day: string
	time: string
	semester: string
}

export default function PathBuilderPage() {
	const { data: coursesList, isLoading: coursesLoading } = useCourses()
	const { data: schedulesWithSections, isLoading: schedulesLoading } =
		useAllSchedulesWithSections()
	const prerequisiteMap = usePrerequisiteMap()

	const coursesMap = useMemo(() => {
		const map: Record<string, Course> = {}
		for (const c of coursesList ?? []) {
			map[c.id] = c
		}
		return map
	}, [coursesList])

	const scheduleEntries = useMemo((): ScheduleEntry[] => {
		const entries: ScheduleEntry[] = []
		for (const schedule of schedulesWithSections ?? []) {
			const semesterLabel = `${schedule.semester} ${schedule.year}`
			for (const ss of schedule.schedule_sections ?? []) {
				const section = ss.section
				const course = section?.course
				if (!section || !course) continue
				const timeStr = `${formatTimeDisplay(section.start_time)}–${formatTimeDisplay(section.end_time)}`
				for (const day of section.day_pattern ?? []) {
					entries.push({
						courseId: course.id,
						course,
						day,
						time: timeStr,
						semester: semesterLabel,
					})
				}
			}
		}
		return entries
	}, [schedulesWithSections])

	const recommendationMap = useMemo((): Record<string, Course[]> => {
		const map: Record<string, Course[]> = {}
		prerequisiteMap.forEach((prereqIds, courseId) => {
			const recommendedCourse = coursesMap[courseId]
			if (!recommendedCourse) return
			for (const prereqId of prereqIds) {
				const list = map[prereqId] ?? []
				if (!list.some((c) => c.id === recommendedCourse.id)) {
					list.push(recommendedCourse)
				}
				map[prereqId] = list
			}
		})
		return map
	}, [prerequisiteMap, coursesMap])

	const skillRequirementsMap = useMemo((): Record<string, string[]> => ({}), [])
	const [viewMode, setViewMode] = useState<'schedule' | 'calendar'>('schedule')
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

	const handleCourseSelect = (course: Course) => {
		setSelectedCourse(course)
	}

	const handleSwitchToCalendar = (course: Course) => {
		setSelectedCourse(course)
		setViewMode('calendar')
	}

	return (
		<div className="min-h-screen bg-gt-white">
			<PageHeader
				title="Path Builder"
				subtitle="Review your previous semesters and plan your next courses"
				homeHref="/"
			/>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="mb-6 flex items-center justify-end">

					{/* View Toggle */}
					<div className="flex gap-2">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setViewMode('schedule')}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
								viewMode === 'schedule'
									? 'bg-gt-tech-gold text-gt-navy shadow-lg'
									: 'bg-gt-navy/10 text-gt-navy hover:bg-gt-navy/20'
							}`}
						>
							<Grid3x3 className="h-5 w-5" />
							Schedule
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setViewMode('calendar')}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
								viewMode === 'calendar'
									? 'bg-gt-tech-gold text-gt-navy shadow-lg'
									: 'bg-gt-navy/10 text-gt-navy hover:bg-gt-navy/20'
							}`}
						>
							<Calendar className="h-5 w-5" />
							Calendar
						</motion.button>
					</div>
				</div>

				{/* Schedule View */}
				<AnimatePresence mode="wait">
					{viewMode === 'schedule' && (
						<motion.div
							key="schedule"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
						>
							{coursesLoading || schedulesLoading ? (
								<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-8" aria-hidden>
									<div className="space-y-6">
										<div className="flex gap-4 overflow-hidden">
											{Array.from({ length: 3 }).map((_, i) => (
												<Skeleton key={i} className="h-32 w-48 shrink-0 rounded-lg" />
											))}
										</div>
										<div className="space-y-3">
											<Skeleton className="h-4 w-24" />
											<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
												{Array.from({ length: 6 }).map((_, i) => (
													<Skeleton key={i} className="h-16 rounded-lg" />
												))}
											</div>
										</div>
									</div>
								</div>
							) : (
							<SemesterSchedule
								scheduleEntries={scheduleEntries}
								recommendationMap={recommendationMap}
								skillRequirementsMap={skillRequirementsMap}
								onCourseSelect={handleCourseSelect}
								onSwitchToCalendar={handleSwitchToCalendar}
							/>
							)}

							{/* Info Section */}
							<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6">
									<h3 className="text-lg font-bold text-gt-navy mb-4 flex items-center gap-2">
										<Grid3x3 className="h-5 w-5 text-gt-tech-gold" />
										Schedule View
									</h3>
									<p className="text-sm text-gt-gray-matter">
										Browse your past semesters organized by week. Hover over any course to see
										recommended next courses.
									</p>
								</div>

								<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-6">
									<h3 className="text-lg font-bold text-gt-navy mb-4">How to Use</h3>
									<ul className="space-y-2 text-sm text-gt-gray-matter">
										<li>• Hover over a course to see recommendations</li>
										<li>• Click "Add to Schedule" to plan next semester</li>
										<li>• Switch to Calendar for detailed time planning</li>
									</ul>
								</div>

								<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-6">
									<h3 className="text-lg font-bold text-gt-navy mb-4">Tips</h3>
									<ul className="space-y-2 text-sm text-gt-gray-matter">
										<li>• Build on prerequisite skills</li>
										<li>• Balance difficulty levels</li>
										<li>• Plan ahead with calendar view</li>
									</ul>
								</div>
							</div>
						</motion.div>
					)}

					{/* Calendar View */}
					{viewMode === 'calendar' && (
						<motion.div
							key="calendar"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
							className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-8"
						>
							<div className="max-w-4xl">
								<h2 className="text-2xl font-bold text-gt-navy mb-4">Course Planning Calendar</h2>

								{selectedCourse && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="rounded-lg border-l-4 border-gt-tech-gold bg-gt-tech-gold/10 p-4 mb-6"
									>
										<div className="flex items-start justify-between">
											<div>
												<p className="text-sm font-semibold text-gt-navy">Ready to add:</p>
												<p className="text-lg font-bold text-gt-navy mt-1">
													{selectedCourse.department} {selectedCourse.course_number}:{' '}
													{selectedCourse.course_name}
												</p>
												<p className="text-sm text-gt-gray-matter mt-1">
													{selectedCourse.description}
												</p>
												<p className="text-xs text-gt-gray-matter mt-2">
													{selectedCourse.credit_hours} credits
												{selectedCourse.difficulty_rating != null &&
													` • Difficulty: ${selectedCourse.difficulty_rating}/5`}
												</p>
											</div>
											<button
												onClick={() => setSelectedCourse(null)}
												className="text-gt-navy hover:text-gt-navy/70 transition-colors"
											>
												<X className="h-5 w-5" />
											</button>
										</div>
									</motion.div>
								)}

								<div className="bg-gt-navy/5 rounded-lg p-8 text-center">
									<Calendar className="h-12 w-12 text-gt-tech-gold mx-auto mb-4 opacity-50" />
									<p className="text-gt-gray-matter mb-4">
										Interactive calendar scheduler coming soon!
									</p>
									<p className="text-sm text-gt-gray-matter">
										You can select specific time slots for {selectedCourse?.course_name || 'courses'} and
										see room availability.
									</p>
								</div>

								<button
									onClick={() => setViewMode('schedule')}
									className="mt-6 w-full rounded-lg bg-gt-navy px-6 py-3 font-semibold text-gt-white hover:bg-gt-navy/90 transition-colors"
								>
									Back to Schedule
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}
