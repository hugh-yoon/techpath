'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div
			className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8"
			role="alert"
		>
			<h2 className="text-lg font-semibold">Something went wrong</h2>
			<p className="max-w-md text-center text-sm text-gt-gray-matter dark:text-foreground-muted">
				{error.message}
			</p>
			<div className="flex gap-2">
				<Button variant="outline" onClick={reset}>
					Try again
				</Button>
				<Button variant="outline" asChild>
					<Link href="/">Go home</Link>
				</Button>
			</div>
		</div>
	)
}
