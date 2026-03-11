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
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { prerequisiteSchema, type PrerequisiteFormValues } from '@/lib/validations'

interface PrerequisiteFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (values: PrerequisiteFormValues) => Promise<void>
	courseOptions: Array<{ id: string; label: string }>
}

export function PrerequisiteFormDialog({
	open,
	onOpenChange,
	onSubmit,
	courseOptions,
}: PrerequisiteFormDialogProps) {
	const form = useForm<PrerequisiteFormValues>({
		resolver: zodResolver(prerequisiteSchema),
		defaultValues: {
			course_id: '',
			prerequisite_course_id: '',
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				course_id: courseOptions[0]?.id ?? '',
				prerequisite_course_id: courseOptions[0]?.id ?? '',
			})
		}
	}, [open, courseOptions])

	const handleSubmit = form.handleSubmit(async (values) => {
		await onSubmit(values)
		onOpenChange(false)
		form.reset()
	})

	const handleOpenChange = (next: boolean) => {
		if (!next) form.reset()
		onOpenChange(next)
	}

	const courseId = form.watch('course_id')
	const prereqOptions = courseOptions.filter((c) => c.id !== courseId)

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Add Prerequisite</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label>Course</Label>
						<Select
							value={form.watch('course_id')}
							onValueChange={(v) => {
								form.setValue('course_id', v)
								if (form.getValues('prerequisite_course_id') === v) {
									form.setValue('prerequisite_course_id', '')
								}
							}}
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
						<Label>Prerequisite Course</Label>
						<Select
							value={form.watch('prerequisite_course_id')}
							onValueChange={(v) => form.setValue('prerequisite_course_id', v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select prerequisite" />
							</SelectTrigger>
							<SelectContent>
								{prereqOptions.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{form.formState.errors.prerequisite_course_id && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.prerequisite_course_id.message}
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
							Add
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
