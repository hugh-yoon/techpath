'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
	id: string
	type: 'user' | 'assistant'
	content: string
	timestamp: Date
}

export function TechPlanChat() {
	const [isOpen, setIsOpen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			type: 'assistant',
			content: 'Hi! I\'m TechPlan AI. Ask me anything about Georgia Tech prerequisites, course requirements, or skill recommendations. For example: "What Java topics from CS 1331 do I need for CS 1332?"',
			timestamp: new Date(),
		},
	])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		// Add user message
		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: input,
			timestamp: new Date(),
		}
		setMessages((prev) => [...prev, userMessage])
		setInput('')
		setIsLoading(true)

		// Simulate AI response
		setTimeout(() => {
			const responses: Record<string, string> = {
				'java': 'Java fundamentals from CS 1331 that are important for CS 1332 include: Object-oriented programming principles, inheritance, polymorphism, and exception handling. You should be comfortable with building classes, understanding interfaces, and debugging complex object-based programs.',
				'prerequisite': 'To check prerequisites, I analyze the course syllabus and learning objectives. Most 3000+ level courses require solid fundamentals in algorithms, data structures, and programming concepts.',
				'skill': 'Skill proficiency is determined by your performance in prerequisite courses. I recommend focusing on: algorithmic thinking, problem-solving, code analysis, and debugging techniques.',
				'default': 'That\'s a great question! Based on typical Georgia Tech curriculum patterns, I can help you understand which skills and concepts are most important. What specific course or skill are you interested in?',
			}

			let response = responses.default
			const lowerInput = input.toLowerCase()
			if (lowerInput.includes('java')) response = responses.java
			if (lowerInput.includes('prerequisite')) response = responses.prerequisite
			if (lowerInput.includes('skill')) response = responses.skill

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
								<h3 className="font-bold text-gt-tech-gold">TechPlan AI</h3>
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
								<form
									onSubmit={handleSendMessage}
									className="flex gap-2 border-t border-gt-navy/10 bg-gt-diploma p-3 rounded-b-xl"
								>
									<input
										type="text"
										value={input}
										onChange={(e) => setInput(e.target.value)}
										placeholder="Ask about prerequisites..."
										className="flex-1 rounded-lg bg-gt-white px-3 py-2 text-sm border border-gt-navy/20 focus:outline-none focus:ring-2 focus:ring-gt-tech-gold"
										disabled={isLoading}
									/>
									<button
										type="submit"
										disabled={isLoading || !input.trim()}
										className="rounded-lg bg-gt-tech-gold p-2 text-gt-navy transition-colors hover:bg-gt-tech-medium-gold disabled:opacity-50"
									>
										<Send className="h-4 w-4" />
									</button>
								</form>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
