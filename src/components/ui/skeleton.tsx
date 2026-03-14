'use client'

import { cn } from '@/lib/utils'

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'animate-pulse rounded-md bg-gt-pi-mile/60 dark:bg-gt-gray-matter/30',
				className,
			)}
			{...props}
		/>
	)
}

export { Skeleton }
