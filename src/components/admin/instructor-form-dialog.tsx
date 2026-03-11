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
import { instructorSchema, type InstructorFormValues } from '@/lib/validations'
import { DEPARTMENTS } from '@/utils/constants'
import type { Instructor } from '@/types'

interface InstructorFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (values: InstructorFormValues) => Promise<void>
	instructor?: Instructor | null
}

export function InstructorFormDialog({
	open,
	onOpenChange,
	onSubmit,
	instructor,
}: InstructorFormDialogProps) {
	const isEdit = !!instructor
	const form = useForm<InstructorFormValues>({
		resolver: zodResolver(instructorSchema),
		defaultValues: {
			name: '',
			department: DEPARTMENTS[0],
			rating: null,
			teaching_style: null,
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				name: instructor?.name ?? '',
				department: instructor?.department ?? DEPARTMENTS[0],
				rating: instructor?.rating ?? null,
				teaching_style: instructor?.teaching_style ?? null,
			})
		}
	}, [open, instructor])

	const handleSubmit = form.handleSubmit(async (values) => {
		await onSubmit(values)
		onOpenChange(false)
		form.reset()
	})

	const handleOpenChange = (next: boolean) => {
		if (!next) form.reset()
		onOpenChange(next)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit Instructor' : 'Create Instructor'}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" {...form.register('name')} />
						{form.formState.errors.name && (
							<p className="text-sm text-red-600" role="alert">
								{form.formState.errors.name.message}
							</p>
						)}
					</div>
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
					</div>
					<div className="grid gap-2">
						<Label htmlFor="rating">Rating (0-5)</Label>
						<Input
							id="rating"
							type="number"
							min={0}
							max={5}
							step={0.1}
							{...form.register('rating')}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="teaching_style">Teaching Style</Label>
						<Input
							id="teaching_style"
							{...form.register('teaching_style')}
							value={form.watch('teaching_style') ?? ''}
							onChange={(e) =>
								form.setValue('teaching_style', e.target.value || null)
							}
						/>
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
