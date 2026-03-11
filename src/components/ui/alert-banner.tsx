'use client'

import { AlertCircle } from 'lucide-react'

interface AlertBannerProps {
	text: string
	icon?: React.ReactNode
	className?: string
}

export function AlertBanner({ text, icon, className = '' }: AlertBannerProps) {
	return (
		<div className={`flex items-center gap-3 rounded-lg bg-gt-alert-red/10 px-4 py-3 border border-gt-alert-red/30 ${className}`}>
			<AlertCircle className="h-5 w-5 flex-shrink-0 text-gt-alert-red" />
			<span className="text-sm font-semibold text-gt-alert-red">{text}</span>
		</div>
	)
}
