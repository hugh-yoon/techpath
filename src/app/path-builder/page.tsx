'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BackLink } from '@/components/ui/back-link'
import { SemesterSchedule } from '@/components/path-builder'
import { Course } from '@/types'
import { Calendar, Grid3x3, X } from 'lucide-react'

interface ScheduleEntry {
	courseId: string
	course: Course
	day: string
	time: string
	semester: string
}

// Mock data for courses
const COURSES_MAP: Record<string, Course> = {
	'1': {
		id: '1',
		department: 'CS',
		course_number: 1331,
		course_name: 'Introduction to OOP',
		description: 'Object-oriented programming fundamentals',
		credit_hours: 3,
		difficulty_rating: 3.5,
	},
	'2': {
		id: '2',
		department: 'CS',
		course_number: 1332,
		course_name: 'Data Structures',
		description: 'Lists, stacks, queues, trees, and graphs',
		credit_hours: 3,
		difficulty_rating: 4.0,
	},
	'3': {
		id: '3',
		department: 'CS',
		course_number: 2340,
		course_name: 'Objects and Design',
		description: 'Object-oriented design patterns',
		credit_hours: 3,
		difficulty_rating: 3.8,
	},
	'4': {
		id: '4',
		department: 'MATH',
		course_number: 1552,
		course_name: 'Calculus II',
		description: 'Advanced calculus concepts',
		credit_hours: 4,
		difficulty_rating: 3.8,
	},
	'5': {
		id: '5',
		department: 'CS',
		course_number: 3510,
		course_name: 'Design of Operating Systems',
		description: 'Operating system design and concepts',
		credit_hours: 3,
		difficulty_rating: 4.2,
	},
	'6': {
		id: '6',
		department: 'CS',
		course_number: 3600,
		course_name: 'Artificial Intelligence',
		description: 'AI fundamentals, algorithms, and applications',
		credit_hours: 3,
		difficulty_rating: 4.3,
	},
	'7': {
		id: '7',
		department: 'CS',
		course_number: 3603,
		course_name: 'Computer Networks',
		description: 'Network protocols, architecture, and communication',
		credit_hours: 3,
		difficulty_rating: 4.1,
	},
	'8': {
		id: '8',
		department: 'CS',
		course_number: 4641,
		course_name: 'Machine Learning',
		description: 'ML algorithms, supervised and unsupervised learning',
		credit_hours: 3,
		difficulty_rating: 4.4,
	},
}

// Mock semester schedule data
const SEMESTER_SCHEDULE: ScheduleEntry[] = [
	// Spring 2026
	{ courseId: '6', course: COURSES_MAP['6'], day: 'Monday', time: '10:00-11:30', semester: 'Spring 2026' },
	{ courseId: '6', course: COURSES_MAP['6'], day: 'Wednesday', time: '10:00-11:30', semester: 'Spring 2026' },
	{ courseId: '7', course: COURSES_MAP['7'], day: 'Tuesday', time: '13:00-14:30', semester: 'Spring 2026' },
	{ courseId: '7', course: COURSES_MAP['7'], day: 'Thursday', time: '13:00-14:30', semester: 'Spring 2026' },
	{ courseId: '8', course: COURSES_MAP['8'], day: 'Friday', time: '09:00-10:30', semester: 'Spring 2026' },

	// Fall 2026
	{ courseId: '1', course: COURSES_MAP['1'], day: 'Monday', time: '09:00-10:30', semester: 'Fall 2026' },
	{ courseId: '1', course: COURSES_MAP['1'], day: 'Wednesday', time: '09:00-10:30', semester: 'Fall 2026' },
	{ courseId: '4', course: COURSES_MAP['4'], day: 'Tuesday', time: '14:00-15:30', semester: 'Fall 2026' },
	{ courseId: '4', course: COURSES_MAP['4'], day: 'Thursday', time: '14:00-15:30', semester: 'Fall 2026' },
]

// Recommendation mapping - which courses recommend which next courses
const RECOMMENDATION_MAP: Record<string, Course[]> = {
	'1': [COURSES_MAP['2'], COURSES_MAP['3']], // CS 1331 recommends CS 1332 and CS 2340
	'2': [COURSES_MAP['3'], COURSES_MAP['5']], // CS 1332 recommends CS 2340 and CS 3510
	'3': [COURSES_MAP['5'], COURSES_MAP['6']], // CS 2340 recommends CS 3510 and CS 3600
	'4': [], // MATH 1552 has no direct CS recommendations
	'5': [COURSES_MAP['6'], COURSES_MAP['7']], // CS 3510 recommends CS 3600 and CS 3603
	'6': [COURSES_MAP['8']], // CS 3600 recommends CS 4641
	'7': [COURSES_MAP['8']], // CS 3603 recommends CS 4641
	'8': [], // CS 4641 is advanced capstone
}

// Skill requirements mapping - which skills are needed for each course
const SKILL_REQUIREMENTS_MAP: Record<string, string[]> = {
	'1': ['Problem Solving', 'Mathematical Foundation'], // CS 1331 prerequisites
	'2': ['Object-Oriented Programming', 'Java Proficiency', 'Algorithm Analysis'], // CS 1332 prerequisites
	'3': ['Object-Oriented Programming', 'Data Structures', 'Design Patterns'], // CS 2340 prerequisites
	'4': ['Calculus Fundamentals', 'Mathematical Reasoning'], // MATH 1552 prerequisites
	'5': ['Data Structures', 'Algorithm Analysis', 'System Design', 'Java Proficiency'], // CS 3510 prerequisites
	'6': ['Algorithm Analysis', 'Data Structures', 'Python Proficiency', 'Logic & Reasoning'], // CS 3600 prerequisites
	'7': ['Data Structures', 'Algorithm Analysis', 'System Architecture', 'Java Proficiency'], // CS 3603 prerequisites
	'8': ['Machine Learning Theory', 'Linear Algebra', 'Statistics', 'Python Proficiency'], // CS 4641 prerequisites
}

export default function PathBuilderPage() {
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
			{/* Header */}
			<div className="border-b border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl font-bold text-gt-tech-gold mb-2">Path Builder</h1>
					<p className="text-gt-white/80">
						Review your previous semesters and plan your next courses
					</p>
				</div>
			</div>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="mb-6 flex items-center justify-between">
					<BackLink href="/">Home</BackLink>

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
							<SemesterSchedule
								scheduleEntries={SEMESTER_SCHEDULE}
								recommendationMap={RECOMMENDATION_MAP}
								skillRequirementsMap={SKILL_REQUIREMENTS_MAP}
								onCourseSelect={handleCourseSelect}
								onSwitchToCalendar={handleSwitchToCalendar}
							/>

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
													{selectedCourse.credit_hours} credits • Difficulty: {selectedCourse.difficulty_rating}/5
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
