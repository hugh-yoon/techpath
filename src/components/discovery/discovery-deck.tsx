'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Course } from '@/types'
import { DiscoveryCard } from './discovery-card'
import { ChevronDown, Sparkles } from 'lucide-react'

interface DiscoveryDeckProps {
	courses: (Course & { cost?: string; gradeDistribution?: Record<string, number> })[]
	onAddCourse?: (course: Course) => void
	onViewDetails?: (course: Course) => void
}

export function DiscoveryDeck({ courses, onAddCourse, onViewDetails }: DiscoveryDeckProps) {
	const [index, setIndex] = useState(0)
	const [direction, setDirection] = useState<'left' | 'right' | null>(null)

	const currentCourse = courses[index]
	const progress = ((index + 1) / courses.length) * 100

	const handleSwipe = (newDirection: 'left' | 'right', shouldAdd?: boolean) => {
		setDirection(newDirection)
		setTimeout(() => {
			// Call onAddCourse if swiping right and shouldAdd is true
			if (newDirection === 'right' && shouldAdd && onAddCourse) {
				onAddCourse(currentCourse)
			}
			
			if (index < courses.length - 1) {
				setIndex(index + 1)
			} else if (index === courses.length - 1) {
				// Loop back to start
				setIndex(0)
			}
			setDirection(null)
		}, 300)
	}

	const handleAction = (action: 'add' | 'skip' | 'details') => {
		if (action === 'add') {
			handleSwipe('right', true)
		} else if (action === 'details' && onViewDetails) {
			onViewDetails(currentCourse)
			handleSwipe('right', false)
		} else if (action === 'skip') {
			handleSwipe('left', false)
		}
	}

	return (
		<div className="flex h-full flex-col items-center justify-center">
			{/* Header */}
			<div className="mb-8 text-center">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Sparkles className="h-6 w-6 text-gt-tech-gold" />
					<h2 className="text-3xl font-bold text-gt-navy">Discovery Deck</h2>
				</div>
				<p className="text-gt-gray-matter">Swipe through courses to find your next class</p>
			</div>

			{/* Progress bar */}
			<div className="w-full max-w-md mb-6">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-semibold text-gt-navy">{index + 1} of {courses.length}</span>
					<span className="text-sm text-gt-gray-matter">{Math.round(progress)}%</span>
				</div>
				<div className="h-2 w-full rounded-full bg-gt-navy/10">
					<motion.div
						className="h-full rounded-full bg-gradient-to-r from-gt-tech-gold to-gt-tech-medium-gold"
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.3 }}
					/>
				</div>
			</div>

			{/* Card Stack */}
			<div className="relative h-96 w-full max-w-md">
				<AnimatePresence mode="wait">
					{currentCourse && (
						<motion.div
							key={index}
							initial={{
								opacity: 0,
								x: direction === 'left' ? 100 : -100,
								rotateZ: direction === 'left' ? 10 : -10,
							}}
							animate={{ opacity: 1, x: 0, rotateZ: 0 }}
							exit={{
								opacity: 0,
								x: direction === 'left' ? -100 : 100,
								rotateZ: direction === 'left' ? -10 : 10,
							}}
							transition={{ duration: 0.3, ease: 'easeInOut' }}
							className="absolute inset-0"
							drag="x"
							dragElastic={0.2}
							onDragEnd={(event, info) => {
								if (info.velocity.x > 500) {
									handleSwipe("right", true)
								} else if (info.velocity.x < -500) {
									handleSwipe("left", false)
								}
							}}
						>
							<DiscoveryCard
								course={currentCourse}
								onAction={handleAction}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Subtle hint */}
				<div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gt-gray-matter">
					<ChevronDown className="h-4 w-4 animate-bounce" />
					<span className="text-xs">Drag to swipe</span>
				</div>
			</div>

			{/* Completion state */}
			{index === courses.length - 1 && direction === null && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className="mt-16 text-center"
				>
					<p className="text-lg font-semibold text-gt-navy mb-4">You've reviewed all courses!</p>
					<button
						onClick={() => setIndex(0)}
						className="rounded-lg bg-gt-tech-gold px-6 py-2 font-semibold text-gt-navy transition-colors hover:bg-gt-tech-medium-gold"
					>
						Start Over
					</button>
				</motion.div>
			)}
		</div>
	)
}
