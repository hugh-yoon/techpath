'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Course } from '@/types'
import { ArrowRight, Award, CheckCircle2, Zap } from 'lucide-react'

interface PathNode {
	course: Course
	skills: string[]
	completed: boolean
	position: { x: number; y: number }
}

interface CourseSkillMap {
	[courseId: string]: string[]
}

interface PathBuilderProps {
	completedCourses: Course[]
	recommendedCourses: Course[]
	skillMastery?: Record<string, number>
	onCourseSelect?: (course: Course, updatedSkills: Record<string, number>) => void
}

// Define which skills each course develops
const COURSE_SKILL_MAP: CourseSkillMap = {
	'1': ['Object-Oriented Programming', 'Java Proficiency'],
	'2': ['Data Structures', 'Algorithm Analysis'],
	'3': ['Problem Solving'],
	'4': ['Software Design', 'Object-Oriented Programming'],
	'5': ['Algorithm Analysis', 'System Design'],
}

export function PathBuilder({
	completedCourses,
	recommendedCourses,
	skillMastery = {},
	onCourseSelect,
}: PathBuilderProps) {
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
	const [dynamicSkillMastery, setDynamicSkillMastery] = useState(skillMastery)

	// Create path nodes
	const createNodes = (): PathNode[] => {
		const nodes: PathNode[] = []

		// Completed courses on the left
		completedCourses.forEach((course, i) => {
			nodes.push({
				course,
				completed: true,
				skills: COURSE_SKILL_MAP[course.id] || [],
				position: { x: 100, y: 50 + i * 120 },
			})
		})

		// Recommended courses on the right
		recommendedCourses.forEach((course, i) => {
			nodes.push({
				course,
				completed: false,
				skills: COURSE_SKILL_MAP[course.id] || [],
				position: { x: 600, y: 50 + i * 120 },
			})
		})

		return nodes
	}

	const handleCourseSelect = (course: Course) => {
		setSelectedCourse(course.id)
		
		// Update skill proficiency based on selected course
		const courseSkills = COURSE_SKILL_MAP[course.id] || []
		const updatedSkills = { ...dynamicSkillMastery }
		
		// Increase proficiency for course-specific skills by 15%
		courseSkills.forEach(skill => {
			updatedSkills[skill] = Math.min(
				1.0,
				(updatedSkills[skill] || 0) + 0.15
			)
		})
		
		setDynamicSkillMastery(updatedSkills)
		onCourseSelect?.(course, updatedSkills)
	}

	const nodes = createNodes()
	const height = Math.max(600, completedCourses.length * 120)
	const selectedCourseObj = recommendedCourses.find(c => c.id === selectedCourse)
	const selectedCourseSkills = selectedCourseObj ? (COURSE_SKILL_MAP[selectedCourseObj.id] || []) : []

	return (
		<div className="flex flex-col rounded-2xl border-2 border-gt-navy/10 bg-gradient-to-b from-gt-white to-gt-diploma p-6">
			{/* Header */}
			<div className="mb-6 flex items-center gap-3">
				<Award className="h-6 w-6 text-gt-tech-gold" />
				<h2 className="text-2xl font-bold text-gt-navy">Path Builder</h2>
				<span className="text-sm text-gt-gray-matter ml-auto">Your Learning Journey</span>
			</div>

			{/* SVG Canvas for lines with better directionality */}
			<svg
				className="w-full mb-6 border border-gt-navy/5 rounded-lg bg-gradient-to-b from-gt-white to-gt-diploma/50"
				style={{ height: `${height}px`, minHeight: '400px' }}
				viewBox={`0 0 800 ${height}`}
				preserveAspectRatio="none"
			>
				{/* Column dividers */}
				<line x1="50" y1="0" x2="50" y2={height} stroke="#54585a" strokeWidth="1" strokeDasharray="2,2" opacity="0.2" />
				<line x1="400" y1="0" x2="400" y2={height} stroke="#b3a369" strokeWidth="2" opacity="0.3" />
				
				{/* Dashed vector lines between courses */}
				{completedCourses.length > 0 &&
					recommendedCourses.length > 0 &&
					completedCourses.flatMap((completed, i) =>
						recommendedCourses.map((recommended, j) => {
							const startX = 250
							const startY = 50 + (i * height) / (completedCourses.length + 1) + 40
							const endX = 550
							const endY = (height / 2) + 50 + (j * 120) + 40
							const isSelected = selectedCourse === recommended.id
							const opacity = !selectedCourse || isSelected ? 0.6 : 0.15

							return (
								<g key={`${i}-${j}`}>
									{/* Curved path */}
									<motion.path
										d={`M ${startX} ${startY} Q 400 ${(startY + endY) / 2} ${endX} ${endY}`}
										stroke={isSelected ? '#b3a369' : '#d6dbd4'}
										strokeWidth={isSelected ? 3 : 1.5}
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
										opacity={opacity}
									/>
									
									{/* Arrowhead at end of path */}
									{isSelected && (
										<motion.polygon
											points={`${endX},${endY} ${endX - 8},${endY - 5} ${endX - 8},${endY + 5}`}
											fill="#b3a369"
											opacity="0.8"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ delay: 0.3 }}
										/>
									)}
									
									{/* Skill labels on selected paths */}
									{isSelected && selectedCourseSkills.length > 0 && (
										<motion.text
											x={(startX + endX) / 2}
											y={(startY + endY) / 2 - 10}
											textAnchor="middle"
											fontSize="11"
											fontWeight="500"
											fill="#003057"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.5 }}
										>
											{selectedCourseSkills.join(' • ')}
										</motion.text>
									)}
								</g>
							)
						})
					)}

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
							recommendedCourses.map((course) => {
								const courseSkills = COURSE_SKILL_MAP[course.id] || []
								const isSelected = selectedCourse === course.id
								
								return (
									<motion.button
										key={course.id}
										onClick={() => handleCourseSelect(course)}
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
											isSelected
												? 'border-gt-tech-gold bg-gt-tech-gold/10 shadow-md'
												: 'border-gt-navy/20 bg-gt-white hover:border-gt-tech-gold/50'
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1">
												<p className="font-semibold text-gt-navy text-sm">
													{course.department} {course.course_number}
												</p>
												<p className="text-xs text-gt-gray-matter mt-1 truncate">
													{course.course_name}
												</p>
												
												{/* Show skills this course develops */}
												{courseSkills.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1">
														{courseSkills.map((skill) => (
															<span
																key={skill}
																className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gt-tech-gold/20 text-gt-tech-dark-gold"
															>
																<Zap className="h-3 w-3" />
																{skill}
															</span>
														))}
													</div>
												)}
											</div>
											{isSelected ? (
												<CheckCircle2 className="h-5 w-5 text-gt-tech-gold mt-1 flex-shrink-0" />
											) : (
												<ArrowRight className="h-4 w-4 text-gt-gray-matter mt-1 flex-shrink-0" />
											)}
										</div>
									</motion.button>
								)
							})
						)}
					</div>
				</div>
			</div>

			{/* Skill Mastery Legend */}
			{Object.keys(dynamicSkillMastery).length > 0 && (
				<div className="mt-6 border-t border-gt-navy/10 pt-4">
					<div className="flex items-center justify-between mb-3">
						<p className="text-xs font-semibold text-gt-gray-matter uppercase">Skill Proficiency</p>
						{selectedCourse && selectedCourseSkills.length > 0 && (
							<motion.span
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-xs font-medium text-gt-tech-gold bg-gt-tech-gold/20 px-2 py-1 rounded"
							>
								+15% to {selectedCourseSkills.length} skill{selectedCourseSkills.length > 1 ? 's' : ''}
							</motion.span>
						)}
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{Object.entries(dynamicSkillMastery).map(([skill, proficiency]) => {
							const isRelevant = selectedCourseSkills.includes(skill)
							return (
								<motion.div
									key={skill}
									className={`rounded-lg p-2 border transition-all ${
										isRelevant
											? 'border-gt-tech-gold/50 bg-gt-tech-gold/10'
											: 'border-gt-navy/10 bg-gt-navy/5'
									}`}
									animate={{
										scale: isRelevant ? 1.05 : 1,
										boxShadow: isRelevant ? '0 0 12px rgba(179, 163, 105, 0.2)' : 'none',
									}}
								>
									<div className="text-xs font-semibold text-gt-navy mb-1 flex items-center gap-1">
										{isRelevant && <Zap className="h-3 w-3 text-gt-tech-gold" />}
										{skill}
									</div>
									<div className="h-2 rounded-full bg-gt-navy/10">
										<motion.div
											className={`h-full rounded-full ${
												isRelevant
													? 'bg-gradient-to-r from-gt-tech-gold to-gt-buzz-gold'
													: 'bg-gradient-to-r from-gt-tech-gold to-gt-tech-medium-gold'
											}`}
											initial={{ width: 0 }}
											animate={{ width: `${proficiency * 100}%` }}
											transition={{ duration: 0.8, delay: 0.2 }}
										/>
									</div>
									<div className="text-xs text-gt-gray-matter mt-1">
										{Math.round(proficiency * 100)}%
									</div>
								</motion.div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
