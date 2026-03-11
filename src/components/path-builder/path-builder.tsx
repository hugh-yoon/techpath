'use client'

import { motion } from 'framer-motion'
import { Course } from '@/types'
import { ArrowRight, Award } from 'lucide-react'

interface PathNode {
	course: Course
	skills: string[]
	completed: boolean
	position: { x: number; y: number }
}

interface PathBuilderProps {
	completedCourses: Course[]
	recommendedCourses: Course[]
	skillMastery?: Record<string, number>
}

export function PathBuilder({
	completedCourses,
	recommendedCourses,
	skillMastery = {},
}: PathBuilderProps) {
	// Create path nodes
	const createNodes = (): PathNode[] => {
		const nodes: PathNode[] = []

		// Completed courses on the left
		completedCourses.forEach((course, i) => {
			nodes.push({
				course,
				completed: true,
				skills: Object.keys(skillMastery)
					.filter((skill) => skillMastery[skill] > 0.7)
					.slice(0, 3),
				position: { x: 100, y: 50 + i * 120 },
			})
		})

		// Recommended courses on the right
		recommendedCourses.forEach((course, i) => {
			nodes.push({
				course,
				completed: false,
				skills: Object.keys(skillMastery)
					.filter((skill) => skillMastery[skill] > 0.5)
					.slice(0, 3),
				position: { x: 700, y: 50 + i * 120 },
			})
		})

		return nodes
	}

	const nodes = createNodes()
	const height = Math.max(600, completedCourses.length * 120)

	return (
		<div className="flex flex-col rounded-2xl border-2 border-gt-navy/10 bg-gradient-to-b from-gt-white to-gt-diploma p-6">
			{/* Header */}
			<div className="mb-6 flex items-center gap-3">
				<Award className="h-6 w-6 text-gt-tech-gold" />
				<h2 className="text-2xl font-bold text-gt-navy">Path Builder</h2>
				<span className="text-sm text-gt-gray-matter ml-auto">Your Learning Journey</span>
			</div>

			{/* SVG Canvas for lines */}
			<svg
				className="w-full mb-6"
				style={{ height: `${height}px`, minHeight: '300px' }}
				viewBox={`0 0 800 ${height}`}
				preserveAspectRatio="none"
			>
				{/* Dashed vector lines between courses */}
				{completedCourses.length > 0 &&
					recommendedCourses.length > 0 &&
					completedCourses.map((completed, i) => (
						recommendedCourses.map((recommended, j) => {
							const startX = 250
							const startY = 50 + (i * height) / (completedCourses.length + 1) + 40
							const endX = 550
							const endY = (height / 2) + 50 + (j * 120) + 40

							return (
								<motion.path
									key={`${i}-${j}`}
									d={`M ${startX} ${startY} Q 400 ${(startY + endY) / 2} ${endX} ${endY}`}
									stroke="url(#goldGradient)"
									strokeWidth="2"
									fill="none"
									strokeDasharray="5,5"
									strokeLinecap="round"
									initial={{ strokeDashoffset: 1000 }}
									animate={{ strokeDashoffset: 0 }}
									transition={{
										duration: 2,
										delay: j * 0.1,
										repeat: Infinity,
										ease: 'linear',
									}}
									opacity="0.4"
								/>
							)
						})
					))}

				{/* Gradient definition */}
				<defs>
					<linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#b3a369" stopOpacity="1" />
						<stop offset="100%" stopColor="#a4925a" stopOpacity="1" />
					</linearGradient>
				</defs>
			</svg>

			{/* Nodes Container */}
			<div className="grid grid-cols-2 gap-8">
				{/* Completed Courses */}
				<div className="space-y-4">
					<h3 className="font-bold text-gt-navy flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-gt-tech-gold" />
						Completed
					</h3>
					<div className="space-y-3">
						{completedCourses.length === 0 ? (
							<p className="text-sm text-gt-gray-matter">No completed courses yet</p>
						) : (
							completedCourses.map((course) => (
								<motion.div
									key={course.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									className="rounded-lg border-2 border-gt-tech-gold/30 bg-gt-diploma p-3"
								>
									<p className="font-semibold text-gt-navy text-sm">
										{course.department} {course.course_number}
									</p>
									<p className="text-xs text-gt-gray-matter mt-1 truncate">
										{course.course_name}
									</p>
								</motion.div>
							))
						)}
					</div>
				</div>

				{/* Recommended Courses */}
				<div className="space-y-4">
					<h3 className="font-bold text-gt-navy flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-gt-navy" />
						Recommended
					</h3>
					<div className="space-y-3">
						{recommendedCourses.length === 0 ? (
							<p className="text-sm text-gt-gray-matter">Complete more courses to see recommendations</p>
						) : (
							recommendedCourses.map((course) => (
								<motion.div
									key={course.id}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className="rounded-lg border-2 border-gt-navy/20 bg-gt-white p-3 hover:border-gt-tech-gold/50 transition-colors cursor-pointer"
								>
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="font-semibold text-gt-navy text-sm">
												{course.department} {course.course_number}
											</p>
											<p className="text-xs text-gt-gray-matter mt-1 truncate">
												{course.course_name}
											</p>
										</div>
										<ArrowRight className="h-4 w-4 text-gt-tech-gold mt-1 flex-shrink-0" />
									</div>
								</motion.div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Skill Mastery Legend */}
			{Object.keys(skillMastery).length > 0 && (
				<div className="mt-6 border-t border-gt-navy/10 pt-4">
					<p className="text-xs font-semibold text-gt-gray-matter uppercase mb-3">Skill Proficiency</p>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{Object.entries(skillMastery).map(([skill, proficiency]) => (
							<div key={skill} className="rounded-lg bg-gt-navy/5 p-2">
								<div className="text-xs font-semibold text-gt-navy mb-1">{skill}</div>
								<div className="h-2 rounded-full bg-gt-navy/10">
									<motion.div
										className="h-full rounded-full bg-gradient-to-r from-gt-tech-gold to-gt-tech-medium-gold"
										initial={{ width: 0 }}
										animate={{ width: `${proficiency * 100}%` }}
										transition={{ duration: 0.8, delay: 0.2 }}
									/>
								</div>
								<div className="text-xs text-gt-gray-matter mt-1">
									{Math.round(proficiency * 100)}%
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
