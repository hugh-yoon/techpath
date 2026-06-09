'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DataPaginationProps {
	page: number
	totalCount: number
	pageSize: number
	onPageChange: (page: number) => void
	ariaLabel?: string
}

export function DataPagination({
	page,
	totalCount,
	pageSize,
	onPageChange,
	ariaLabel = 'Pagination',
}: DataPaginationProps) {
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
	const [jumpInput, setJumpInput] = useState(String(page + 1))

	useEffect(() => {
		setJumpInput(String(page + 1))
	}, [page])

	const clampPage = useCallback(
		(next: number) => Math.min(Math.max(0, next), totalPages - 1),
		[totalPages],
	)

	const handleJump = useCallback(() => {
		const parsed = parseInt(jumpInput, 10)
		if (Number.isNaN(parsed) || parsed < 1) return
		onPageChange(clampPage(parsed - 1))
	}, [clampPage, jumpInput, onPageChange])

	const handleJumpKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') handleJump()
		},
		[handleJump],
	)

	const navButtonClass =
		'rounded-lg border-2 border-gt-navy/20 px-3 py-2 text-sm font-medium text-gt-navy transition-colors hover:bg-gt-navy/10 disabled:opacity-50 dark:border-gt-gray-matter dark:text-foreground'

	if (totalCount === 0) return null

	return (
		<nav
			className="mt-4 flex flex-wrap items-center gap-2"
			aria-label={ariaLabel}
		>
			<button
				type="button"
				onClick={() => onPageChange(0)}
				disabled={page === 0}
				className={navButtonClass}
				aria-label="First page"
			>
				First
			</button>
			<button
				type="button"
				onClick={() => onPageChange(clampPage(page - 1))}
				disabled={page === 0}
				className={navButtonClass}
				aria-label="Previous page"
			>
				Prev
			</button>
			<div className="flex items-center gap-2">
				<Label htmlFor="page-jump" className="sr-only">
					Go to page
				</Label>
				<Input
					id="page-jump"
					type="number"
					min={1}
					max={totalPages}
					value={jumpInput}
					onChange={(e) => setJumpInput(e.target.value)}
					onKeyDown={handleJumpKeyDown}
					className="w-20"
					aria-label="Page number"
				/>
				<button
					type="button"
					onClick={handleJump}
					className={navButtonClass}
					aria-label="Go to page"
				>
					Go
				</button>
			</div>
			<span className="text-sm text-gt-gray-matter dark:text-foreground-muted">
				Page {page + 1} of {totalPages} ({totalCount} total)
			</span>
			<button
				type="button"
				onClick={() => onPageChange(clampPage(page + 1))}
				disabled={page >= totalPages - 1}
				className={navButtonClass}
				aria-label="Next page"
			>
				Next
			</button>
			<button
				type="button"
				onClick={() => onPageChange(totalPages - 1)}
				disabled={page >= totalPages - 1}
				className={navButtonClass}
				aria-label="Last page"
			>
				Last
			</button>
		</nav>
	)
}
