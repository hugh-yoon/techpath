'use client'

import { useEffect } from 'react'
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
import { sectionSchema, type SectionFormValues } from '@/lib/validations'
import { getTimeSlots } from '@/utils/time'
import { DAYS_OF_WEEK } from '@/utils/constants'
import type { Section } from '@/types'
import type { DayOfWeek } from '@/types'

interface SectionFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (values: SectionFormValues) => Promise<void>
	section?: Section | null
	courseOptions: Array<{ id: string; label: string }>
	instructorOptions: Array<{ id: string; label: string }>
}

export function SectionFormDialog({
	open,
	onOpenChange,
	onSubmit,
	section,
	courseOptions,
	instructorOptions,
}: SectionFormDialogProps) {
	const isEdit = !!section
	const timeSlots = getTimeSlots()
	const form = useForm<SectionFormValues>({
		resolver: zodResolver(sectionSchema),
		defaultValues: {
			course_id: '',
			instructor_id: '',
			section_code: '',
			day_pattern: [],
			start_time: '09:00',
			end_time: '10:15',
			location: null,
			crn: '',
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				course_id: section?.course_id ?? courseOptions[0]?.id ?? '',
				instructor_id: section?.instructor_id ?? instructorOptions[0]?.id ?? '',
				section_code: section?.section_code ?? '',
				day_pattern: section?.day_pattern ?? [],
				start_time: section?.start_time?.slice(0, 5) ?? '09:00',
				end_time: section?.end_time?.slice(0, 5) ?? '10:15',
				location: section?.location ?? null,
				crn: section?.crn ?? '',
			})
		}
	}, [open, section, courseOptions, instructorOptions])

	const handleSubmit = form.handleSubmit(async (values) => {
		await onSubmit(values)
		onOpenChange(false)
		form.reset()
	})

	const handleOpenChange = (next: boolean) => {
		if (!next) form.reset()
		onOpenChange(next)
	}

	const toggleDay = (day: DayOfWeek) => {
		const current = form.getValues('day_pattern')
		if (current.includes(day)) {
			form.setValue(
				'day_pattern',
				current.filter((d) => d !== day),
			)
		} else {
			form.setValue('day_pattern', [...current, day])
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit Section' : 'Create Section'}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label>Course</Label>
						<Select
							value={form.watch('course_id')}
							onValueChange={(v) => form.setValue('course_id', v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select course" />
							</SelectTrigger>
							<SelectContent>
								{courseOptions.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{form.formState.errors.course_id && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.course_id.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label>Instructor</Label>
						<Select
							value={form.watch('instructor_id')}
							onValueChange={(v) => form.setValue('instructor_id', v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select instructor" />
							</SelectTrigger>
							<SelectContent>
								{instructorOptions.map((i) => (
									<SelectItem key={i.id} value={i.id}>
										{i.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{form.formState.errors.instructor_id && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.instructor_id.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="section_code">Section Code</Label>
						<Input id="section_code" {...form.register('section_code')} />
						{form.formState.errors.section_code && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.section_code.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label>Meeting Days</Label>
						<div className="flex flex-wrap gap-2">
							{DAYS_OF_WEEK.map((day) => (
								<label
									key={day}
									className="flex cursor-pointer items-center gap-1.5 rounded border border-gt-pi-mile px-3 py-1.5 text-sm dark:border-gt-gray-matter"
								>
									<input
										type="checkbox"
										checked={form.watch('day_pattern').includes(day)}
										onChange={() => toggleDay(day)}
										className="rounded"
										aria-label={day}
									/>
									{day.slice(0, 3)}
								</label>
							))}
						</div>
						{form.formState.errors.day_pattern && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.day_pattern.message}
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div className="grid gap-2">
							<Label>Start Time</Label>
							<Select
								value={form.watch('start_time')}
								onValueChange={(v) => form.setValue('start_time', v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeSlots.map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label>End Time</Label>
							<Select
								value={form.watch('end_time')}
								onValueChange={(v) => form.setValue('end_time', v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeSlots.map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{form.formState.errors.end_time && (
						<p className="text-sm text-red-600" role="alert">
							{form.formState.errors.end_time.message}
						</p>
					)}
					<div className="grid gap-2">
						<Label htmlFor="location">Location</Label>
						<Input
							id="location"
							{...form.register('location')}
							value={form.watch('location') ?? ''}
							onChange={(e) =>
								form.setValue('location', e.target.value || null)
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="crn">CRN</Label>
						<Input id="crn" {...form.register('crn')} />
						{form.formState.errors.crn && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.crn.message}
							</p>
						)}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={form.formState.isSubmitting}>
							{isEdit ? 'Save' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
