'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Course } from '@/types'
import { ChevronRight, Clock, BookOpen, X } from 'lucide-react'

interface ScheduleEntry {
	courseId: string
	course: Course
	day: string
	time: string
	semester: string
}

interface SemesterScheduleProps {
	scheduleEntries: ScheduleEntry[]
	recommendationMap?: Record<string, Course[]>
	skillRequirementsMap?: Record<string, string[]>
	onCourseSelect?: (course: Course) => void
	onSwitchToCalendar?: (course: Course) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function SemesterSchedule({
	scheduleEntries,
	recommendationMap = {},
	skillRequirementsMap = {},
	onCourseSelect,
	onSwitchToCalendar,
}: SemesterScheduleProps) {
	const [hoveredEntryKey, setHoveredEntryKey] = useState<string | null>(null)
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

	// Group courses by semester and maintain order
	const groupedBySemester = scheduleEntries.reduce(
		(acc, entry) => {
			if (!acc[entry.semester]) {
				acc[entry.semester] = []
			}
			acc[entry.semester].push(entry)
			return acc
		},
		{} as Record<string, ScheduleEntry[]>
	)

	// Maintain the order semesters appear in the array instead of sorting
	const semesters = Array.from(new Map(scheduleEntries.map((e) => [e.semester, true])).keys())

	// get recommendations for hovered course
	const getRecommendations = (courseId: string): Course[] => {
		return recommendationMap[courseId] || []
	}

	const getEntryKey = (entry: ScheduleEntry) =>
		`${entry.semester}-${entry.day}-${entry.courseId}-${entry.time}`

	return (
		<div className="space-y-8">
			{/* Semesters */}
			{semesters.map((semester) => {
				const entries = groupedBySemester[semester]

				// Group by day
				const byDay: Record<string, ScheduleEntry[]> = {}
				DAYS.forEach((day) => {
					byDay[day] = entries.filter((e) => e.day === day)
				})

				return (
					<motion.div
						key={semester}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-lg border-2 border-gt-navy/10 bg-gradient-to-b from-gt-white to-gt-diploma p-6"
					>
						{/* Semester Header */}
						<h3 className="mb-6 text-xl font-bold text-gt-navy">{semester}</h3>

						{/* Weekly Grid */}
						<div className="grid grid-cols-5 gap-4">
							{DAYS.map((day) => (
								<div key={day} className="space-y-2">
									{/* Day Header */}
									<div className="rounded-lg bg-gt-navy/5 px-3 py-2 text-center">
										<p className="text-sm font-semibold text-gt-navy">{day}</p>
									</div>

									{/* Courses for this day */}
									<div className="space-y-2 min-h-32">
										{byDay[day].length === 0 ? (
											<p className="text-xs text-gt-gray-matter text-center py-4">No classes</p>
										) : (
											byDay[day].map((entry) => (
												<motion.div
													key={`${entry.courseId}-${entry.time}`}
													onHoverStart={() => setHoveredEntryKey(getEntryKey(entry))}
													onHoverEnd={() => setHoveredEntryKey(null)}
													onClick={() => onCourseSelect?.(entry.course)}
													className={`relative cursor-pointer group ${
														hoveredEntryKey === getEntryKey(entry) ? 'z-40' : 'z-0'
													}`}
													whileHover={{ scale: 1.02 }}
												>
													{/* Course Card */}
													<motion.div
														className={`rounded-lg border-2 p-3 transition-all ${
															hoveredEntryKey === getEntryKey(entry)
																? 'border-gt-tech-gold bg-gt-tech-gold/10 shadow-lg'
																: 'border-gt-navy/20 bg-gt-white hover:border-gt-tech-gold/50'
														}`}
														animate={{
															backgroundColor:
																hoveredEntryKey === getEntryKey(entry)
																	? 'rgba(179, 163, 105, 0.1)'
																	: 'white',
														}}
													>
														<p className="font-semibold text-sm text-gt-navy">
															{entry.course.department} {entry.course.course_number}
														</p>
														<p className="text-xs text-gt-gray-matter mt-1 line-clamp-1">
															{entry.course.course_name}
														</p>
														<div className="flex items-center gap-1 mt-2 text-xs text-gt-gray-matter">
															<Clock className="h-3 w-3" />
															{entry.time}
														</div>
													</motion.div>

													{/* Hover Recommendations */}
													<AnimatePresence>
														{hoveredEntryKey === getEntryKey(entry) && (
															<motion.div
																initial={{ opacity: 0, scale: 0.95, y: -10 }}
																animate={{ opacity: 1, scale: 1, y: 0 }}
																exit={{ opacity: 0, scale: 0.95, y: -10 }}
																className="absolute left-0 right-0 top-full mt-2 z-[999] w-56"
															>
																<div className="rounded-lg border-2 border-gt-tech-gold bg-gt-white shadow-xl p-4">
																	<p className="text-xs font-semibold text-gt-navy mb-3">
																		Next Steps
																	</p>
																	<div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
																		{getRecommendations(entry.courseId).length > 0 ? (
																			getRecommendations(entry.courseId).map((rec) => (
																				<div key={rec.id} className="text-xs border-b border-gt-navy/10 pb-2 last:border-b-0">
																					<p className="font-medium text-gt-navy">
																						{rec.department} {rec.course_number}
																					</p>
																					<p className="text-gt-gray-matter text-xs truncate mb-2">
																						{rec.course_name}
																					</p>
																					{/* Skills Required */}
																					{skillRequirementsMap[rec.id] && skillRequirementsMap[rec.id].length > 0 && (
																						<div className="bg-gt-navy/5 rounded px-2 py-1 mb-1">
																							<p className="text-xs font-semibold text-gt-navy mb-1">Skills Required:</p>
																							<div className="space-y-1">
																								{skillRequirementsMap[rec.id].map((skill) => (
																									<div key={skill} className="flex items-start gap-1">
																										<span className="text-gt-tech-gold mt-0.5">•</span>
																										<span className="text-gt-gray-matter">{skill}</span>
																									</div>
																								))}
																							</div>
																						</div>
																					)}
																				</div>
																			))
																		) : (
																			<p className="text-xs text-gt-gray-matter italic">
																				No recommendations yet
																			</p>
																		)}
																	</div>
																	<button
																		onClick={() => {
																			onSwitchToCalendar?.(entry.course)
																			setSelectedCourse(entry.course)
																		}}
																		className="w-full rounded-lg bg-gt-tech-gold px-3 py-2 text-xs font-semibold text-gt-navy hover:bg-gt-tech-gold/90 transition-colors flex items-center justify-center gap-2"
																	>
																		Add to Schedule
																		<ChevronRight className="h-3 w-3" />
																	</button>
																</div>
															</motion.div>
														)}
													</AnimatePresence>
												</motion.div>
											))
										)}
									</div>
								</div>
							))}
						</div>
					</motion.div>
				)
			})}
		</div>
	)
}
