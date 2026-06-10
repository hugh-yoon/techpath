'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface AuthFormShellProps {
	title: string
	subtitle: string
	children: React.ReactNode
	footer: React.ReactNode
}

export function AuthFormShell({
	title,
	subtitle,
	children,
	footer,
}: AuthFormShellProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gt-white p-6">
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="w-full max-w-md rounded-2xl border-2 border-gt-navy/10 bg-gt-diploma p-6 shadow-sm"
			>
				<div className="mb-6 text-center">
					<Link
						href="/"
						className="text-sm font-medium text-gt-gray-matter hover:text-gt-navy"
					>
						← Back to TechPlan
					</Link>
					<h1 className="mt-4 text-2xl font-semibold text-gt-navy">{title}</h1>
					<p className="mt-1 text-sm text-gt-gray-matter">{subtitle}</p>
				</div>
				{children}
				<div className="mt-6 text-center text-sm text-gt-gray-matter">
					{footer}
				</div>
			</motion.div>
		</div>
	)
}
