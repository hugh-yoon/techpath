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
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { courseSchema, type CourseFormValues } from '@/lib/validations'
import { DEPARTMENTS } from '@/utils/constants'
import type { Course } from '@/types'

interface CourseFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (values: CourseFormValues) => Promise<void>
	course?: Course | null
}

export function CourseFormDialog({
	open,
	onOpenChange,
	onSubmit,
	course,
}: CourseFormDialogProps) {
	const isEdit = !!course
	const form = useForm<CourseFormValues>({
		resolver: zodResolver(courseSchema),
		defaultValues: {
			department: course?.department ?? DEPARTMENTS[0],
			course_number: course?.course_number ?? 0,
			course_name: course?.course_name ?? '',
			description: course?.description ?? null,
			credit_hours: course?.credit_hours ?? 3,
			difficulty_rating: course?.difficulty_rating ?? null,
		},
	})

	const handleSubmit = form.handleSubmit(async (values) => {
		await onSubmit(values)
		onOpenChange(false)
		form.reset()
	})

	useEffect(() => {
		if (open) {
			form.reset({
				department: course?.department ?? DEPARTMENTS[0],
				course_number: course?.course_number ?? 0,
				course_name: course?.course_name ?? '',
				description: course?.description ?? null,
				credit_hours: course?.credit_hours ?? 3,
				difficulty_rating: course?.difficulty_rating ?? null,
			})
		}
	}, [open, course])

	const handleOpenChange = (next: boolean) => {
		if (!next) form.reset()
		onOpenChange(next)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit Course' : 'Create Course'}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="department">Department</Label>
						<Select
							value={form.watch('department')}
							onValueChange={(v) => form.setValue('department', v)}
						>
							<SelectTrigger id="department">
								<SelectValue placeholder="Select department" />
							</SelectTrigger>
							<SelectContent>
								{DEPARTMENTS.map((d) => (
									<SelectItem key={d} value={d}>
										{d}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{form.formState.errors.department && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.department.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="course_number">Course Number</Label>
						<Input
							id="course_number"
							type="number"
							{...form.register('course_number')}
						/>
						{form.formState.errors.course_number && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.course_number.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="course_name">Course Name</Label>
						<Input id="course_name" {...form.register('course_name')} />
						{form.formState.errors.course_name && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.course_name.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							{...form.register('description')}
							value={form.watch('description') ?? ''}
							onChange={(e) =>
								form.setValue('description', e.target.value || null)
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="credit_hours">Credit Hours</Label>
						<Input
							id="credit_hours"
							type="number"
							{...form.register('credit_hours')}
						/>
						{form.formState.errors.credit_hours && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.credit_hours.message}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="difficulty_rating">Difficulty (1-5)</Label>
						<Input
							id="difficulty_rating"
							type="number"
							min={1}
							max={5}
							{...form.register('difficulty_rating')}
						/>
						{form.formState.errors.difficulty_rating && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.difficulty_rating.message}
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
