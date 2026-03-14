'use client'

import { useState, useEffect } from 'react'
import { useSchedules } from '@/hooks/use-schedules'
import { supabase } from '@/lib/supabaseClient'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { SEMESTERS } from '@/utils/constants'

interface AddToScheduleDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	sectionId: string
	onSuccess?: () => void
}

export function AddToScheduleDialog({
	open,
	onOpenChange,
	sectionId,
	onSuccess,
}: AddToScheduleDialogProps) {
	const { data: schedules, refetch } = useSchedules()
	const [creating, setCreating] = useState(false)
	const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const createForm = useForm<ScheduleFormValues>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: {
			name: '',
			semester: 'Fall',
			year: new Date().getFullYear(),
		},
	})

	useEffect(() => {
		if (open) refetch()
	}, [open, refetch])

	const handleAddToExisting = async () => {
		if (!selectedScheduleId) return
		setSubmitError(null)
		const { error } = await supabase.from('schedule_sections').insert({
			schedule_id: selectedScheduleId,
			section_id: sectionId,
		})
		if (error) {
			setSubmitError(error.message)
			return
		}
		onSuccess?.()
		onOpenChange(false)
	}

	const handleCreateAndAdd = createForm.handleSubmit(async (values) => {
		setSubmitError(null)
		const { data: newSchedule, error: insertError } = await supabase
			.from('schedules')
			.insert({ name: values.name, semester: values.semester, year: values.year })
			.select('id')
			.single()
		if (insertError || !newSchedule) {
			setSubmitError(insertError?.message ?? 'Failed to create schedule')
			return
		}
		const { error: linkError } = await supabase.from('schedule_sections').insert({
			schedule_id: newSchedule.id,
			section_id: sectionId,
		})
		if (linkError) {
			setSubmitError(linkError.message)
			return
		}
		onSuccess?.()
		onOpenChange(false)
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Add to Schedule</DialogTitle>
				</DialogHeader>
				{submitError && (
					<p className="text-sm text-red-600" role="alert">
						{submitError}
					</p>
				)}
				<div className="space-y-4">
					<div className="grid gap-2">
						<Label>Existing schedule</Label>
						<Select
							value={selectedScheduleId ?? ''}
							onValueChange={(v) => {
								setSelectedScheduleId(v || null)
								setCreating(false)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a schedule" />
							</SelectTrigger>
							<SelectContent>
								{schedules.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name} – {s.semester} {s.year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							size="sm"
							onClick={() => {
								setCreating(true)
								setSelectedScheduleId(null)
							}}
						>
							Create new schedule
						</Button>
					</div>
					{creating ? (
						<form onSubmit={handleCreateAndAdd} className="grid gap-2">
							<Label htmlFor="new-name">Schedule name</Label>
							<Input
								id="new-name"
								{...createForm.register('name')}
								placeholder="e.g. Fall 2025"
							/>
							{createForm.formState.errors.name && (
								<p className="text-sm text-red-600">
									{createForm.formState.errors.name.message}
								</p>
							)}
							<div className="grid grid-cols-2 gap-2">
								<div>
									<Label>Semester</Label>
									<Select
										value={createForm.watch('semester')}
										onValueChange={(v) => createForm.setValue('semester', v)}
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
									<Label htmlFor="new-year">Year</Label>
									<Input
										id="new-year"
										type="number"
										{...createForm.register('year')}
									/>
								</div>
							</div>
							<DialogFooter className="mt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setCreating(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createForm.formState.isSubmitting}>
									Create and add
								</Button>
							</DialogFooter>
						</form>
					) : (
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleAddToExisting}
								disabled={!selectedScheduleId}
							>
								Add to schedule
							</Button>
						</DialogFooter>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
