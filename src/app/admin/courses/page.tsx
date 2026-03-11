'use client'

import { useState, useCallback } from 'react'
import { useCourses } from '@/hooks/use-courses'
import { supabase } from '@/lib/supabaseClient'
import { BackLink } from '@/components/ui/back-link'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { CourseFormDialog } from '@/components/admin/course-form-dialog'
import type { Course } from '@/types'
import type { CourseFormValues } from '@/lib/validations'

export default function AdminCoursesPage() {
	const { data: courses, isLoading, error, refetch } = useCourses()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingCourse, setEditingCourse] = useState<Course | null>(null)

	const handleCreate = useCallback(() => {
		setEditingCourse(null)
		setDialogOpen(true)
	}, [])

	const handleEdit = useCallback((course: Course) => {
		setEditingCourse(course)
		setDialogOpen(true)
	}, [])

	const handleSubmit = useCallback(
		async (values: CourseFormValues) => {
			if (editingCourse) {
				await supabase
					.from('courses')
					.update({
						department: values.department,
						course_number: values.course_number,
						course_name: values.course_name,
						description: values.description,
						credit_hours: values.credit_hours,
						difficulty_rating: values.difficulty_rating,
					})
					.eq('id', editingCourse.id)
			} else {
				await supabase.from('courses').insert({
					department: values.department,
					course_number: values.course_number,
					course_name: values.course_name,
					description: values.description,
					credit_hours: values.credit_hours,
					difficulty_rating: values.difficulty_rating,
				})
			}
			await refetch()
		},
		[editingCourse, refetch],
	)

	const handleDelete = useCallback(
		async (id: string) => {
			if (!confirm('Delete this course? This will remove related sections and prerequisites.'))
				return
			await supabase.from('courses').delete().eq('id', id)
			await refetch()
		},
		[refetch],
	)

	if (error) {
		return (
			<div>
				<h1 className="text-xl font-semibold">Courses</h1>
				<p className="mt-2 text-red-600" role="alert">
					{error.message}
				</p>
			</div>
		)
	}

	return (
		<div>
			<div className="mb-4">
				<BackLink href="/admin">Admin</BackLink>
			</div>
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Courses</h1>
				<Button onClick={handleCreate}>Add Course</Button>
			</div>
			<CourseFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmit={handleSubmit}
				course={editingCourse}
			/>
			{isLoading ? (
				<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
				) : (
				<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Department</TableHead>
								<TableHead>Number</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Credits</TableHead>
								<TableHead>Difficulty</TableHead>
								<TableHead className="w-[120px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.map((c) => (
								<TableRow key={c.id}>
									<TableCell>{c.department}</TableCell>
									<TableCell>{c.course_number}</TableCell>
									<TableCell>{c.course_name}</TableCell>
									<TableCell>{c.credit_hours}</TableCell>
									<TableCell>{c.difficulty_rating ?? '—'}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(c)}
											aria-label={`Edit ${c.department} ${c.course_number}`}
										>
											Edit
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-red-600 hover:text-red-700"
											onClick={() => handleDelete(c.id)}
											aria-label={`Delete ${c.department} ${c.course_number}`}
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
