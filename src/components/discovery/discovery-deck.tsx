'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Course } from '@/types'
import { DiscoveryCard } from './discovery-card'
import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react'

interface DiscoveryDeckProps {
	courses: (Course & { cost?: string; gradeDistribution?: Record<string, number> })[]
	onAddCourse?: (course: Course) => void
	onViewDetails?: (course: Course) => void
}

const SWIPE_VELOCITY = 450
const SWIPE_OFFSET = 72

export function DiscoveryDeck({ courses, onAddCourse, onViewDetails }: DiscoveryDeckProps) {
	const [index, setIndex] = useState(0)
	const [direction, setDirection] = useState<'left' | 'right' | null>(null)
	const [history, setHistory] = useState<number[]>([])
	const deckRef = useRef<HTMLDivElement>(null)

	const currentCourse = courses[index]
	const progress = courses.length > 0 ? ((index + 1) / courses.length) * 100 : 0

	const handleSwipe = useCallback(
		(newDirection: 'left' | 'right', shouldAdd?: boolean) => {
			if (!currentCourse || courses.length === 0) return
			const courseAtSwipe = currentCourse
			setDirection(newDirection)
			window.setTimeout(() => {
				if (newDirection === 'right' && shouldAdd && onAddCourse) {
					onAddCourse(courseAtSwipe)
				}
				setHistory((prev) => [...prev, index])
				setIndex((prev) => {
					if (prev < courses.length - 1) return prev + 1
					return 0
				})
				setDirection(null)
			}, 300)
		},
		[courses.length, currentCourse, index, onAddCourse],
	)

	const handleAction = useCallback(
		(action: 'add' | 'skip' | 'details') => {
			if (action === 'add') {
				handleSwipe('right', true)
			} else if (action === 'details' && onViewDetails && currentCourse) {
				onViewDetails(currentCourse)
				handleSwipe('right', false)
			} else if (action === 'skip') {
				handleSwipe('left', false)
			}
		},
		[handleSwipe, onViewDetails, currentCourse],
	)

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			const { velocity, offset } = info
			if (velocity.x > SWIPE_VELOCITY || offset.x > SWIPE_OFFSET) {
				handleSwipe('right', true)
			} else if (velocity.x < -SWIPE_VELOCITY || offset.x < -SWIPE_OFFSET) {
				handleSwipe('left', false)
			}
		},
		[handleSwipe],
	)

	useEffect(() => {
		const el = deckRef.current
		if (!el) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight') {
				e.preventDefault()
				handleSwipe('right', true)
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault()
				handleSwipe('left', false)
			} else if (e.key === 'ArrowDown' && onViewDetails && currentCourse) {
				e.preventDefault()
				handleAction('details')
			}
		}

		el.addEventListener('keydown', handleKeyDown)
		return () => el.removeEventListener('keydown', handleKeyDown)
	}, [handleSwipe, handleAction, onViewDetails, currentCourse])

	if (courses.length === 0) {
		return null
	}

	const handleBack = () => {
		if (history.length === 0 || direction !== null) return
		const previousIndex = history[history.length - 1]
		setHistory((prev) => prev.slice(0, -1))
		setDirection('right')
		setIndex(previousIndex)
		window.setTimeout(() => setDirection(null), 200)
	}

	return (
		<div className="flex h-full flex-col items-center justify-center">
			<div className="mb-4 text-center">
				<div className="mb-1 flex items-center justify-center gap-1.5">
					<Sparkles className="h-5 w-5 text-gt-tech-gold" aria-hidden />
					<p className="text-base font-semibold text-gt-navy">Browse the deck</p>
				</div>
				<p className="text-xs text-gt-gray-matter">
					Swipe or arrow keys — right adds, left skips, down details
				</p>
			</div>

			<div className="mb-3 w-full max-w-md">
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs font-semibold text-gt-navy">
						{index + 1} of {courses.length}
					</span>
					<span className="text-[10px] font-medium uppercase tracking-wide text-gt-gray-matter">
						Progress
					</span>
				</div>
				<div className="h-2 w-full rounded-full bg-gt-navy/10">
					<motion.div
						className="h-full rounded-full bg-gradient-to-r from-gt-tech-gold to-gt-tech-medium-gold"
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.3 }}
					/>
				</div>
			</div>

			<div className="w-full">
				<div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center">
					<div className="flex justify-center">
						<button
							type="button"
							onClick={handleBack}
							disabled={history.length === 0 || direction !== null}
							className="inline-flex h-16 w-7 items-center justify-center rounded-2xl border border-gt-navy/20 bg-gt-white/85 text-gt-navy shadow-sm transition-colors hover:bg-gt-tech-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
							aria-label="Go to previous course card"
						>
							<ChevronLeft className="h-4 w-4" aria-hidden />
						</button>
					</div>
					<div
						ref={deckRef}
						tabIndex={0}
						role="region"
						aria-label="Course discovery deck. Use left and right arrow keys to skip or add."
						className="relative mx-auto h-[min(28rem,72vh)] w-full max-w-md rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2"
					>
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
									onDragEnd={handleDragEnd}
								>
									<DiscoveryCard course={currentCourse} onAction={handleAction} />
								</motion.div>
							)}
						</AnimatePresence>

						<div className="absolute -bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-gt-gray-matter">
							<ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
							<span className="text-xs">Swipe or keyboard</span>
						</div>
					</div>
					<div className="flex justify-center" aria-hidden>
						<div className="h-16 w-7 rounded-2xl" />
					</div>
				</div>
			</div>

			{index === courses.length - 1 && direction === null && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className="mt-16 text-center"
				>
					<p className="mb-4 text-lg font-semibold text-gt-navy">
						You&apos;ve reached the end of this pass
					</p>
					<button
						type="button"
						onClick={() => setIndex(0)}
						className="rounded-lg bg-gt-tech-gold px-6 py-2 font-semibold text-gt-navy transition-colors hover:bg-gt-tech-medium-gold"
					>
						Start over
					</button>
				</motion.div>
			)}
		</div>
	)
}
