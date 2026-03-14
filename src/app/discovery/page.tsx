'use client'

import { useState, useEffect } from 'react'
import { DiscoveryDeck } from '@/components/discovery'
import { Course } from '@/types'

// Mock data for demonstration
const MOCK_COURSES: (Course & { cost?: string; gradeDistribution?: Record<string, number> })[] = [
	{
		id: '1',
		department: 'CS',
		course_number: 1331,
		course_name: 'Introduction to Object-Oriented Programming',
		description:
			'Comprehensive introduction to object-oriented programming, design, and analysis. Students will learn Java fundamentals, OOP principles, and software engineering best practices.',
		credit_hours: 3,
		difficulty_rating: 3.5,
		cost: '$150',
		gradeDistribution: {
			'Final Exam': 30,
			'Homeworks': 35,
			'Participation': 15,
			'Projects': 20,
		},
	},
	{
		id: '2',
		department: 'CS',
		course_number: 1332,
		course_name: 'Data Structures & Algorithms',
		description:
			'Core data structures including lists, stacks, queues, trees, and graphs. Analysis of algorithms and complexity. Implementation and applications.',
		credit_hours: 3,
		difficulty_rating: 4.0,
		cost: '$200',
		gradeDistribution: {
			'Final Exam': 35,
			'Programming Assignments': 40,
			'Midterm': 15,
			'Quizzes': 10,
		},
	},
	{
		id: '3',
		department: 'CS',
		course_number: 2050,
		course_name: 'Introduction to Computer Science',
		description:
			'Overview of fundamental concepts in computer science, including computational thinking, algorithms, and problem-solving strategies.',
		credit_hours: 3,
		difficulty_rating: 2.8,
		gradeDistribution: {
			'Final Project': 40,
			'Assignments': 30,
			'Participation': 20,
			'Attendance': 10,
		},
	},
	{
		id: '4',
		department: 'CS',
		course_number: 2340,
		course_name: 'Objects and Design',
		description:
			'Object-oriented design principles, design patterns, UML, software testing, refactoring. Building robust and maintainable software.',
		credit_hours: 3,
		difficulty_rating: 3.8,
		cost: '$175',
		gradeDistribution: {
			'Design Project': 40,
			'Exams': 35,
			'Programming Assignments': 15,
			'Code Review': 10,
		},
	},
	{
		id: '5',
		department: 'CS',
		course_number: 3510,
		course_name: 'Design of Operating Systems',
		description:
			'Operating system design, process management, memory management, file systems, I/O systems, concurrency, and security.',
		credit_hours: 3,
		difficulty_rating: 4.2,
		cost: '$150',
		gradeDistribution: {
			'Final Exam': 30,
			'Programming Projects': 45,
			'Quizzes': 15,
			'Participation': 10,
		},
	},
]

export default function DiscoveryPage() {
	const [courses, setCourses] = useState<typeof MOCK_COURSES>([])
	const [addedCourses, setAddedCourses] = useState<string[]>([])

	useEffect(() => {
		// Simulate data loading
		setCourses(MOCK_COURSES)
	}, [])

	const handleAddCourse = (course: Course) => {
		setAddedCourses((prev) => [...prev, course.id])
		// You can add additional logic here like showing a toast notification
	}

	const handleViewDetails = (course: Course) => {
		// Navigate to course details page
		window.location.href = `/course/${course.id}`
	}

	return (
		<div className="min-h-screen bg-gt-white">
			{/* Header */}
			<div className="border-b border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl font-bold text-gt-tech-gold mb-2">Discovery Deck</h1>
					<p className="text-gt-white/80">
						Discover new courses and find classes that match your interests
					</p>
				</div>
			</div>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="grid grid-cols-3 gap-8">
					{/* Deck */}
					<div className="col-span-2">
						<div className="rounded-2xl bg-gt-diploma border-2 border-gt-navy/10 p-8">
							{courses.length > 0 ? (
								<DiscoveryDeck
									courses={courses}
									onAddCourse={handleAddCourse}
									onViewDetails={handleViewDetails}
								/>
							) : (
								<div className="flex h-96 items-center justify-center">
									<p className="text-gt-gray-matter">Loading courses...</p>
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
					</div>
				</div>
			</div>
		</div>
	)
}
