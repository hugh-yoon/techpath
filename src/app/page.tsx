'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-provider'
import { OpenInNewTabButton } from '@/components/tabs/open-in-new-tab-button'
import { cn } from '@/lib/utils'

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

/** Fixed size for every home nav card (matches tallest content). */
const HOME_CARD_HEIGHT = 'h-[11rem]'
const HOME_CARD_WIDTH = 'w-full'
const HOME_CARD_COLUMN_WIDTH = 'sm:w-[calc((100%-1rem)/2)]'

const CARD_LINK_CLASS = cn(
	'flex flex-col rounded-xl border-2 p-6 text-left shadow-sm transition-colors',
	'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
	HOME_CARD_HEIGHT,
	HOME_CARD_WIDTH,
)

interface HomeNavCardProps {
	href: string
	title: string
	description: string
	newTabLabel: string
	className?: string
	titleClassName?: string
	centerOnBottomRow?: boolean
}

function HomeNavCard({
	href,
	title,
	description,
	newTabLabel,
	className,
	titleClassName,
	centerOnBottomRow = false,
}: HomeNavCardProps) {
	return (
		<motion.div
			variants={item}
			className={cn(
				centerOnBottomRow
					? cn(
							'sm:col-span-2 flex justify-center',
							HOME_CARD_HEIGHT,
							HOME_CARD_WIDTH,
						)
					: cn(HOME_CARD_HEIGHT, HOME_CARD_WIDTH),
			)}
		>
			<div
				className={cn(
					'relative',
					HOME_CARD_HEIGHT,
					HOME_CARD_WIDTH,
					centerOnBottomRow && HOME_CARD_COLUMN_WIDTH,
				)}
			>
				<OpenInNewTabButton
					href={href}
					newTabLabel={newTabLabel}
					className="absolute top-3 right-3 z-10"
				/>
				<Link href={href} className={cn(CARD_LINK_CLASS, className)}>
					<span
						className={cn(
							'shrink-0 text-lg font-semibold text-gt-navy',
							titleClassName,
						)}
					>
						{title}
					</span>
					<span className="mt-2 line-clamp-3 text-sm leading-snug text-gt-gray-matter">
						{description}
					</span>
				</Link>
			</div>
		</motion.div>
	)
}

export default function Home() {
	const { isAdmin, isAuthenticated } = useAuth()
	const centerCareerPlanner = !isAdmin

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
				className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:auto-rows-[11rem] sm:grid-cols-2"
				aria-label="Main"
				variants={container}
				initial="hidden"
				animate="show"
			>
				<HomeNavCard
					href="/discovery"
					newTabLabel="Discovery Deck"
					title="✨ Discovery Deck"
					description={
						isAuthenticated
							? 'Swipe through courses to find your next class'
							: 'Sign in required — swipe through courses to find your next class'
					}
					className="border-gt-tech-gold bg-gradient-to-br from-gt-white to-gt-diploma hover:border-gt-tech-medium-gold hover:shadow-md"
				/>
				<HomeNavCard
					href="/dashboard"
					newTabLabel="Course Search"
					title="Course Search"
					description="Find courses and sections"
					className="border-gt-pi-mile bg-gt-white hover:border-gt-tech-gold hover:bg-gt-diploma"
				/>
				<HomeNavCard
					href="/schedule"
					newTabLabel="Schedule Builder"
					title="Schedule Builder"
					description="Build semester schedules"
					className="border-gt-pi-mile bg-gt-white hover:border-gt-tech-gold hover:bg-gt-diploma"
				/>
				<HomeNavCard
					href="/path-builder"
					newTabLabel="Path Builder"
					title="🛣️ Path Builder"
					description="Visualize your learning journey"
					className="border-gt-navy/20 bg-gt-white hover:border-gt-tech-gold hover:bg-gt-diploma"
				/>
				<HomeNavCard
					href="/career"
					newTabLabel="Career Planner"
					title="Career Planner"
					description="Plan your degree path"
					centerOnBottomRow={centerCareerPlanner}
					className="border-gt-pi-mile bg-gt-white hover:border-gt-tech-gold hover:bg-gt-diploma"
				/>
				{isAdmin && (
					<motion.div
						variants={item}
						className={cn('relative', HOME_CARD_HEIGHT, HOME_CARD_WIDTH)}
					>
						<Link
							href="/admin"
							className={cn(
								CARD_LINK_CLASS,
								'border-gt-pi-mile bg-gt-white hover:border-gt-tech-gold hover:bg-gt-diploma',
							)}
						>
							<span className="shrink-0 text-lg font-semibold text-gt-tech-dark-gold">
								Admin
							</span>
							<span className="mt-2 line-clamp-3 text-sm leading-snug text-gt-gray-matter">
								Manage courses and data
							</span>
						</Link>
					</motion.div>
				)}
			</motion.nav>
		</div>
	)
}
