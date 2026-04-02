'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarArrowUp, MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
	id: string
	type: 'user' | 'assistant'
	content: string
	timestamp: Date
}

const SCHEDULE_ASSIST_PATHS = ['/schedule', '/path-builder']

export function TechPlanChat() {
	const pathname = usePathname()
	const isScheduleAssistContext = useMemo(
		() => Boolean(pathname && SCHEDULE_ASSIST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))),
		[pathname],
	)

	const defaultWelcome = useMemo(
		() =>
			isScheduleAssistContext
				? 'Hi! I\'m TechPlan AI. Describe the semester you want — mix of CS core, time blocks, or credit targets — and I\'ll suggest a draft schedule. (Prototype: replies are simulated.)'
				: 'Hi! I\'m TechPlan AI. Ask me anything about Georgia Tech prerequisites, course requirements, or skill recommendations. For example: "What Java topics from CS 1331 do I need for CS 1332?"',
		[isScheduleAssistContext],
	)

	const [isOpen, setIsOpen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setMessages([
			{
				id: 'welcome',
				type: 'assistant',
				content: defaultWelcome,
				timestamp: new Date(),
			},
		])
	}, [defaultWelcome])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		const text = input.trim()
		if (!text) return

		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: text,
			timestamp: new Date(),
		}
		setMessages((prev) => [...prev, userMessage])
		setInput('')
		setIsLoading(true)

		setTimeout(() => {
			const responses: Record<string, string> = {
				java: 'Java fundamentals from CS 1331 that are important for CS 1332 include: Object-oriented programming principles, inheritance, polymorphism, and exception handling. You should be comfortable with building classes, understanding interfaces, and debugging complex object-based programs.',
				prerequisite:
					'To check prerequisites, I analyze the course syllabus and learning objectives. Most 3000+ level courses require solid fundamentals in algorithms, data structures, and programming concepts.',
				skill: 'Skill proficiency is determined by your performance in prerequisite courses. I recommend focusing on: algorithmic thinking, problem-solving, code analysis, and debugging techniques.',
				scheduleDraft:
					'Try clustering labs on one day and keeping a contiguous block for math or theory. Leave at least one lighter day for project courses. When the draft feels right, use Send to calendar to preview an export (prototype only—not connected to a real calendar yet).',
				default:
					"That's a great question! Based on typical Georgia Tech curriculum patterns, I can help you understand which skills and concepts are most important. What specific course or skill are you interested in?",
			}

			const lower = text.toLowerCase()
			let response = responses.default
			if (
				isScheduleAssistContext &&
				(lower.includes('schedule') ||
					lower.includes('calendar') ||
					lower.includes('credit') ||
					lower.includes('monday') ||
					lower.includes('tuesday') ||
					lower.includes('wednesday') ||
					lower.includes('thursday') ||
					lower.includes('friday'))
			) {
				response = responses.scheduleDraft
			}
			if (lower.includes('java')) response = responses.java
			if (lower.includes('prerequisite')) response = responses.prerequisite
			if (lower.includes('skill')) response = responses.skill

			const assistantMessage: Message = {
				id: Date.now().toString(),
				type: 'assistant',
				content: response,
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, assistantMessage])
			setIsLoading(false)
		}, 800)
	}

	return (
		<>
			{/* Chat Button */}
			<motion.button
				onClick={() => {
					setIsOpen(!isOpen)
					setIsMinimized(false)
				}}
				className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gt-tech-gold to-gt-tech-medium-gold shadow-lg transition-transform hover:scale-110"
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
			>
				<MessageCircle className="h-6 w-6 text-gt-navy" />
			</motion.button>

			{/* Chat Window */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						className={`fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl border-2 border-gt-navy/20 bg-gt-white shadow-2xl transition-all ${
							isMinimized ? 'h-14 w-80' : 'h-96 w-96'
						}`}
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b-2 border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-4 py-3 rounded-t-xl">
							<div className="flex items-center gap-2">
								<div className="h-2.5 w-2.5 rounded-full bg-gt-tech-gold animate-pulse" />
								<div>
									<h3 className="font-bold text-gt-tech-gold">TechPlan AI</h3>
									{isScheduleAssistContext && (
										<p className="text-[10px] font-medium uppercase tracking-wide text-gt-white/60">
											Schedule assist
										</p>
									)}
								</div>
							</div>
							<div className="flex gap-1">
								<button
									onClick={() => setIsMinimized(!isMinimized)}
									className="p-1 hover:bg-gt-white/10 rounded transition-colors"
									aria-label="Minimize"
								>
									{isMinimized ? (
										<Maximize2 className="h-4 w-4 text-gt-tech-gold" />
									) : (
										<Minimize2 className="h-4 w-4 text-gt-tech-gold" />
									)}
								</button>
								<button
									onClick={() => setIsOpen(false)}
									className="p-1 hover:bg-gt-white/10 rounded transition-colors"
									aria-label="Close"
								>
									<X className="h-4 w-4 text-gt-tech-gold" />
								</button>
							</div>
						</div>

						{/* Messages */}
						{!isMinimized && (
							<>
								<div className="flex-1 overflow-y-auto space-y-4 p-4">
									<AnimatePresence mode="popLayout">
										{messages.map((message) => (
											<motion.div
												key={message.id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
											>
												<div
													className={`max-w-xs rounded-xl px-4 py-2 ${
														message.type === 'user'
															? 'bg-gt-navy text-gt-white rounded-br-none'
															: 'bg-gt-diploma text-gt-navy rounded-bl-none border border-gt-navy/10'
													}`}
												>
													<p className="text-sm">{message.content}</p>
												</div>
											</motion.div>
										))}
										{isLoading && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className="flex justify-start"
											>
												<div className="bg-gt-diploma text-gt-navy rounded-xl rounded-bl-none px-4 py-2 border border-gt-navy/10">
													<div className="flex gap-1">
														<div className="h-2 w-2 rounded-full bg-gt-navy/50 animate-bounce" style={{ animationDelay: '0ms' }} />
														<div className="h-2 w-2 rounded-full bg-gt-navy/50 animate-bounce" style={{ animationDelay: '150ms' }} />
														<div className="h-2 w-2 rounded-full bg-gt-navy/50 animate-bounce" style={{ animationDelay: '300ms' }} />
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
									<div ref={messagesEndRef} />
								</div>

								{/* Input */}
								<div className="rounded-b-xl border-t border-gt-navy/10 bg-gt-diploma">
									{isScheduleAssistContext && (
										<div className="flex justify-end border-b border-gt-navy/10 px-3 py-2">
											<button
												type="button"
												className="inline-flex items-center gap-2 rounded-lg border border-gt-navy/20 bg-gt-white px-3 py-1.5 text-xs font-semibold text-gt-navy shadow-sm transition-colors hover:bg-gt-diploma"
												aria-label="Send to calendar (prototype only, not functional)"
												title="Prototype control — not wired to a calendar"
												onClick={() => {
													/* Hi-fi only: intentionally non-functional */
												}}
											>
												<CalendarArrowUp className="h-4 w-4 text-gt-tech-gold" aria-hidden />
												Send to calendar
											</button>
										</div>
									)}
									<form onSubmit={handleSendMessage} className="flex gap-2 p-3">
										<input
											type="text"
											value={input}
											onChange={(e) => setInput(e.target.value)}
											placeholder={
												isScheduleAssistContext
													? 'Describe your ideal schedule…'
													: 'Ask about prerequisites…'
											}
											className="flex-1 rounded-lg border border-gt-navy/20 bg-gt-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gt-tech-gold"
											disabled={isLoading}
										/>
										<button
											type="submit"
											disabled={isLoading || !input.trim()}
											className="rounded-lg bg-gt-tech-gold p-2 text-gt-navy transition-colors hover:bg-gt-tech-medium-gold disabled:opacity-50"
											aria-label="Send message"
										>
											<Send className="h-4 w-4" />
										</button>
									</form>
								</div>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
