'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps
	extends Omit<React.ComponentProps<typeof Input>, 'type'> {
	id: string
}

export function PasswordInput({
	id,
	className,
	...props
}: PasswordInputProps) {
	const [visible, setVisible] = useState(false)

	const handleToggleVisibility = () => {
		setVisible((current) => !current)
	}

	return (
		<div className="relative">
			<Input
				id={id}
				type={visible ? 'text' : 'password'}
				className={cn('pr-10', className)}
				{...props}
			/>
			<button
				type="button"
				onClick={handleToggleVisibility}
				className={cn(
					'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1',
					'text-gt-gray-matter transition-colors hover:text-gt-navy',
					'focus-visible:outline-none focus-visible:ring-2',
					'focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2',
				)}
				aria-label={visible ? 'Hide password' : 'Show password'}
				aria-controls={id}
				aria-pressed={visible}
			>
				{visible ? (
					<EyeOff className="h-4 w-4" aria-hidden />
				) : (
					<Eye className="h-4 w-4" aria-hidden />
				)}
			</button>
		</div>
	)
}
