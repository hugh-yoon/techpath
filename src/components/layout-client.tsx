'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { TechPlanChat } from '@/components/techplan-chat'
import { ActionToastProvider } from '@/components/ui/action-toast'
import { QueryProvider } from '@/components/providers/query-provider'
import { OpenTabsProvider } from '@/context/open-tabs-provider'
import { TabBar } from '@/components/tabs/tab-bar'

const PAGE_TRANSITION = {
	initial: { opacity: 0, y: 6 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.2, ease: 'easeOut' as const },
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	return (
		<QueryProvider>
			<OpenTabsProvider>
				<ActionToastProvider>
					<TabBar />
					<motion.div
						key={pathname ?? 'layout'}
						initial={PAGE_TRANSITION.initial}
						animate={PAGE_TRANSITION.animate}
						transition={PAGE_TRANSITION.transition}
						className="min-h-screen"
					>
						{children}
					</motion.div>
					<TechPlanChat />
				</ActionToastProvider>
			</OpenTabsProvider>
		</QueryProvider>
	)
}
