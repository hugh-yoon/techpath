'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SubjectFilterProps {
	departments: string[]
	selected: string[]
	onChange: (selected: string[]) => void
	className?: string
}

export function SubjectFilter({
	departments,
	selected,
	onChange,
	className,
}: SubjectFilterProps) {
	const [open, setOpen] = useState(false)
	const panelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		if (open) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [open])

	const toggle = (dept: string) => {
		if (selected.includes(dept)) {
			onChange(selected.filter((d) => d !== dept))
		} else {
			onChange([...selected, dept])
		}
	}

	const selectAll = () => {
		onChange([...departments])
	}

	const clearAll = () => {
		onChange([])
	}

	const label =
		selected.length === 0
			? 'All subjects'
			: selected.length === departments.length
				? 'All subjects'
				: `${selected.length} subject${selected.length === 1 ? '' : 's'}`

	return (
		<div className={cn('relative', className)} ref={panelRef}>
			<Button
				type="button"
				variant="outline"
				onClick={() => setOpen(!open)}
				className="bg-gt-white/10 border-gt-tech-gold/40 text-gt-tech-gold hover:bg-gt-white/20 hover:text-gt-tech-gold gap-1.5"
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label="Filter by subject"
			>
				{label}
				<ChevronDown
					className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
				/>
			</Button>
			{open && (
				<div
					className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border-2 border-gt-navy/10 bg-gt-white shadow-lg dark:border-gt-gray-matter dark:bg-surface"
					role="listbox"
				>
					<div className="flex items-center justify-between border-b border-gt-pi-mile p-2 dark:border-gt-gray-matter">
						<button
							type="button"
							onClick={selectAll}
							className="text-xs font-medium text-gt-navy hover:underline dark:text-foreground"
						>
							Select all
						</button>
						<button
							type="button"
							onClick={clearAll}
							className="text-xs font-medium text-gt-gray-matter hover:underline dark:text-foreground-muted"
						>
							Clear
						</button>
					</div>
					<div className="max-h-72 overflow-y-auto p-2">
						{departments.map((dept) => {
							const isSelected = selected.length === 0 || selected.includes(dept)
							return (
								<button
									key={dept}
									type="button"
									role="option"
									aria-selected={isSelected}
									onClick={() => toggle(dept)}
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gt-navy hover:bg-gt-pi-mile/30 dark:text-foreground dark:hover:bg-gt-gray-matter/30"
								>
									<span
										className={cn(
											'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
											isSelected
												? 'border-gt-tech-gold bg-gt-tech-gold text-gt-navy'
												: 'border-gt-gray-matter dark:border-gt-pi-mile',
										)}
									>
										{isSelected ? <Check className="h-3 w-3" /> : null}
									</span>
									{dept}
								</button>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
