'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => (
		<textarea
			className={cn(
				'flex min-h-[80px] w-full rounded-md border border-gt-pi-mile bg-gt-white px-3 py-2 text-sm ring-offset-white placeholder:text-gt-gray-matter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gt-gray-matter dark:bg-surface dark:ring-offset-background dark:focus-visible:ring-accent',
				className,
			)}
			ref={ref}
			{...props}
		/>
	),
)
Textarea.displayName = 'Textarea'

export { Textarea }
