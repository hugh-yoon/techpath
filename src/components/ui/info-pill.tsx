'use client'

interface InfoPillProps {
	label: string
	value: string
	className?: string
}

export function InfoPill({ label, value, className = '' }: InfoPillProps) {
	return (
		<div className={`flex flex-col items-center gap-1 rounded-full bg-gt-navy/5 px-4 py-2 border border-gt-navy/10 ${className}`}>
			<span className="text-xs font-medium text-gt-gray-matter uppercase tracking-wide">{label}</span>
			<span className="text-sm font-bold text-gt-navy">{value}</span>
		</div>
	)
}
