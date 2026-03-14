'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.06 },
	},
}

const item = {
	hidden: { opacity: 0, y: 10 },
	show: { opacity: 1, y: 0 },
}

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gt-white p-8">
			<motion.h1
				className="text-3xl font-semibold tracking-tight text-gt-navy"
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				TechPlan
			</motion.h1>
			<motion.p
				className="text-gt-gray-matter"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
			>
				Georgia Tech academic intelligence platform for course planning and career paths
			</motion.p>
			<motion.nav
				className="mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2"
				aria-label="Main"
				variants={container}
				initial="hidden"
				animate="show"
			>
				<motion.div variants={item}>
				<Link
					href="/discovery"
					className="flex flex-col rounded-xl border-2 border-gt-tech-gold bg-gradient-to-br from-gt-white to-gt-diploma p-6 text-left shadow-sm transition-colors hover:border-gt-tech-medium-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">✨ Discovery Deck</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Swipe through courses to find your next class</span>
				</Link>
				</motion.div>
				<motion.div variants={item}>
				<Link
					href="/dashboard"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Course Search</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Find courses and sections</span>
				</Link>
				</motion.div>
				<motion.div variants={item}>
				<Link
					href="/schedule"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Schedule Builder</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Build semester schedules</span>
				</Link>
				</motion.div>
				<motion.div variants={item}>
				<Link
					href="/path-builder"
					className="flex flex-col rounded-xl border-2 border-gt-navy/20 bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">🛣️ Path Builder</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Visualize your learning journey</span>
				</Link>
				</motion.div>
				<motion.div variants={item}>
				<Link
					href="/career"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Career Planner</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Plan your degree path</span>
				</Link>
				</motion.div>
				<motion.div variants={item}>
				<Link
					href="/admin"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-tech-dark-gold">Admin</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Manage courses and data</span>
				</Link>
				</motion.div>
			</motion.nav>
		</div>
	)
}
