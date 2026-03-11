'use client'

import { useState } from 'react'
import { BackLink } from '@/components/ui/back-link'
import { PathBuilder } from '@/components/path-builder'
import { Course } from '@/types'

// Mock data for demonstration
const COMPLETED_COURSES: Course[] = [
	{
		id: '1',
		department: 'CS',
		course_number: 1331,
		course_name: 'Introduction to OOP',
		description: 'Object-oriented programming fundamentals',
		credit_hours: 3,
		difficulty_rating: 3.5,
	},
	{
		id: '2',
		department: 'MATH',
		course_number: 1552,
		course_name: 'Calculus II',
		description: 'Advanced calculus concepts',
		credit_hours: 4,
		difficulty_rating: 3.8,
	},
]

const RECOMMENDED_COURSES: Course[] = [
	{
		id: '3',
		department: 'CS',
		course_number: 1332,
		course_name: 'Data Structures',
		description: 'Lists, stacks, queues, trees, and graphs',
		credit_hours: 3,
		difficulty_rating: 4.0,
	},
	{
		id: '4',
		department: 'CS',
		course_number: 2340,
		course_name: 'Objects and Design',
		description: 'Object-oriented design patterns',
		credit_hours: 3,
		difficulty_rating: 3.8,
	},
	{
		id: '5',
		department: 'CS',
		course_number: 3510,
		course_name: 'Design of Operating Systems',
		description: 'Operating system design and concepts',
		credit_hours: 3,
		difficulty_rating: 4.2,
	},
]

const SKILL_MASTERY: Record<string, number> = {
	'Object-Oriented Programming': 0.85,
	'Data Structures': 0.72,
	'Problem Solving': 0.78,
	'Algorithm Analysis': 0.65,
	'Java Proficiency': 0.88,
	'Software Design': 0.71,
}

export default function PathBuilderPage() {
	return (
		<div className="min-h-screen bg-gt-white">
			{/* Header */}
			<div className="border-b border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl font-bold text-gt-tech-gold mb-2">Path Builder</h1>
					<p className="text-gt-white/80">
						Visualize your learning journey with skill-based course recommendations
					</p>
				</div>
			</div>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="mb-4">
					<BackLink href="/">Home</BackLink>
				</div>

				{/* Path Builder visualization */}
				<PathBuilder
					completedCourses={COMPLETED_COURSES}
					recommendedCourses={RECOMMENDED_COURSES}
					skillMastery={SKILL_MASTERY}
				/>

				{/* Info section */}
				<div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* How It Works */}
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-diploma p-6">
						<h3 className="text-lg font-bold text-gt-navy mb-4">How It Works</h3>
						<ul className="space-y-3 text-sm text-gt-gray-matter">
							<li className="flex gap-3">
								<span className="font-bold text-gt-tech-gold">1.</span>
								<span>Your completed courses are shown on the left with dashed vector lines</span>
							</li>
							<li className="flex gap-3">
								<span className="font-bold text-gt-tech-gold">2.</span>
								<span>System analyzes skills demonstrated in those courses</span>
							</li>
							<li className="flex gap-3">
								<span className="font-bold text-gt-tech-gold">3.</span>
								<span>Recommended courses appear on the right based on skill prerequisites</span>
							</li>
							<li className="flex gap-3">
								<span className="font-bold text-gt-tech-gold">4.</span>
								<span>Your skill proficiency is tracked and displayed in the legend</span>
							</li>
						</ul>
					</div>

					{/* Key Features */}
					<div className="rounded-xl border-2 border-gt-navy/10 bg-gt-white p-6">
						<h3 className="text-lg font-bold text-gt-navy mb-4">Key Features</h3>
						<ul className="space-y-3 text-sm text-gt-gray-matter">
							<li className="flex gap-3">
								<span className="text-gt-tech-gold">🎯</span>
								<span><strong>Skill Mapping:</strong> View exactly which skills you've mastered</span>
							</li>
							<li className="flex gap-3">
								<span className="text-gt-tech-gold">🔗</span>
								<span><strong>Smart Connections:</strong> Animated dashed lines show course relationships</span>
							</li>
							<li className="flex gap-3">
								<span className="text-gt-tech-gold">📈</span>
								<span><strong>Progress Tracking:</strong> See your growth across different skill areas</span>
							</li>
							<li className="flex gap-3">
								<span className="text-gt-tech-gold">💡</span>
								<span><strong>Smart Recommendations:</strong> Get courses tailored to your skill profile</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}
