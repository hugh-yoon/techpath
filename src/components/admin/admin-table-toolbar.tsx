'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export interface AdminSelectFilter {
	id: string
	label: string
	value: string
	options: Array<{ value: string; label: string }>
	onChange: (value: string) => void
}

interface AdminTableToolbarProps {
	searchId: string
	searchLabel: string
	searchPlaceholder: string
	searchValue: string
	onSearchChange: (value: string) => void
	filters?: AdminSelectFilter[]
	resultCount?: number
}

export function AdminTableToolbar({
	searchId,
	searchLabel,
	searchPlaceholder,
	searchValue,
	onSearchChange,
	filters = [],
	resultCount,
}: AdminTableToolbarProps) {
	return (
		<div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-gt-pi-mile bg-gt-diploma p-4 dark:border-gt-gray-matter dark:bg-surface">
			<div className="grid min-w-[200px] flex-1 gap-1.5">
				<Label htmlFor={searchId}>{searchLabel}</Label>
				<Input
					id={searchId}
					type="search"
					placeholder={searchPlaceholder}
					value={searchValue}
					onChange={(e) => onSearchChange(e.target.value)}
					aria-label={searchLabel}
				/>
			</div>
			{filters.map((filter) => (
				<div key={filter.id} className="grid gap-1.5">
					<Label htmlFor={filter.id}>{filter.label}</Label>
					<Select value={filter.value} onValueChange={filter.onChange}>
						<SelectTrigger id={filter.id} className="w-[160px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{filter.options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			))}
			{resultCount != null && (
				<p
					className="text-sm text-gt-gray-matter dark:text-foreground-muted"
					aria-live="polite"
				>
					{resultCount} result{resultCount === 1 ? '' : 's'}
				</p>
			)}
		</div>
	)
}
