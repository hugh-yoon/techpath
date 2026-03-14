'use client'

import { TechPlanChat } from '@/components/techplan-chat'

export function LayoutClient({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<TechPlanChat />
		</>
	)
}
