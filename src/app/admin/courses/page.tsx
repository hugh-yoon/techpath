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

const parseRedFlagLines = (raw: string) =>
	raw
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 25)

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
			const lines = parseRedFlagLines(values.red_flag_lines)
			const row = {
				department: values.department,
				course_number: values.course_number,
				course_name: values.course_name,
				description: values.description,
				credit_hours: values.credit_hours,
				difficulty_rating: values.difficulty_rating,
				deck_summary: values.deck_summary,
			}

			if (editingCourse) {
				const { error: upErr } = await supabase
					.from('courses')
					.update(row)
					.eq('id', editingCourse.id)
				if (upErr) {
					console.error(upErr)
					return
				}
				await supabase.from('course_red_flags').delete().eq('course_id', editingCourse.id)
				if (lines.length > 0) {
					const { error: flagErr } = await supabase.from('course_red_flags').insert(
						lines.map((body, sort_order) => ({
							course_id: editingCourse.id,
							body,
							sort_order,
						})),
					)
					if (flagErr) console.error(flagErr)
				}
			} else {
				const { data: created, error: insErr } = await supabase
					.from('courses')
					.insert(row)
					.select('id')
					.single()
				if (insErr) {
					console.error(insErr)
					return
				}
				if (created && lines.length > 0) {
					const { error: flagErr } = await supabase.from('course_red_flags').insert(
						lines.map((body, sort_order) => ({
							course_id: created.id,
							body,
							sort_order,
						})),
					)
					if (flagErr) console.error(flagErr)
				}
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
								<TableHead>Credit hours</TableHead>
								<TableHead>Difficulty</TableHead>
								<TableHead>Discovery</TableHead>
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
									<TableCell className="text-sm text-gt-gray-matter dark:text-foreground-muted">
										{[
											c.deck_summary?.trim() ? 'Summary' : null,
											(c.course_red_flags?.length ?? 0) > 0
												? `${c.course_red_flags?.length} flag(s)`
												: null,
										]
											.filter(Boolean)
											.join(' · ') || '—'}
									</TableCell>
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
