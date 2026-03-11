'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { scheduleSchema, type ScheduleFormValues } from '@/lib/validations'
import { SEMESTERS } from '@/utils/constants'
import { useScheduleStore } from '@/stores/schedule-store'

interface CreateScheduleDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: () => void
}

export function CreateScheduleDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateScheduleDialogProps) {
	const setActiveScheduleId = useScheduleStore((s) => s.setActiveScheduleId)
	const form = useForm<ScheduleFormValues>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: {
			name: '',
			semester: 'Fall',
			year: new Date().getFullYear(),
		},
	})

	const handleSubmit = form.handleSubmit(async (values) => {
		const { supabase } = await import('@/lib/supabaseClient')
		const { data, error } = await supabase
			.from('schedules')
			.insert({ name: values.name, semester: values.semester, year: values.year })
			.select('id')
			.single()
		if (error) {
			form.setError('root', { message: error.message })
			return
		}
		if (data) setActiveScheduleId(data.id)
		onCreated()
		onOpenChange(false)
		form.reset()
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Create schedule</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="e.g. Fall 2025"
							{...form.register('name')}
						/>
						{form.formState.errors.name && (
							<p className="text-sm text-red-600">
								{form.formState.errors.name.message}
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<Label>Semester</Label>
							<Select
								value={form.watch('semester')}
								onValueChange={(v) => form.setValue('semester', v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SEMESTERS.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="year">Year</Label>
							<Input id="year" type="number" {...form.register('year')} />
						</div>
					</div>
					{form.formState.errors.root && (
						<p className="text-sm text-red-600">
							{form.formState.errors.root.message}
						</p>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={form.formState.isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
