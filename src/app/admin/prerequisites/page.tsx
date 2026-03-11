'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAllPrerequisites } from '@/hooks/use-prerequisites'
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
import { PrerequisiteFormDialog } from '@/components/admin/prerequisite-form-dialog'
import type { PrerequisiteFormValues } from '@/lib/validations'

export default function AdminPrerequisitesPage() {
	const { data: prerequisites, isLoading, error, refetch } = useAllPrerequisites()
	const { data: courses } = useCourses()
	const [dialogOpen, setDialogOpen] = useState(false)

	const courseOptions = useMemo(
		() =>
			courses.map((c) => ({
				id: c.id,
				label: `${c.department} ${c.course_number} – ${c.course_name}`,
			})),
		[courses],
	)

	const getCourseLabel = useCallback(
		(id: string) => {
			const c = courses.find((x) => x.id === id)
			return c ? `${c.department} ${c.course_number}` : id
		},
		[courses],
	)

	const handleSubmit = useCallback(
		async (values: PrerequisiteFormValues) => {
			await supabase.from('course_prerequisites').insert({
				course_id: values.course_id,
				prerequisite_course_id: values.prerequisite_course_id,
			})
			await refetch()
		},
		[refetch],
	)

	const handleDelete = useCallback(
		async (id: string) => {
			if (!confirm('Remove this prerequisite?')) return
			await supabase.from('course_prerequisites').delete().eq('id', id)
			await refetch()
		},
		[refetch],
	)

	if (error) {
		return (
			<div>
				<h1 className="text-xl font-semibold">Prerequisites</h1>
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
				<h1 className="text-xl font-semibold">Prerequisites</h1>
				<Button onClick={() => setDialogOpen(true)}>Add Prerequisite</Button>
			</div>
			<PrerequisiteFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmit={handleSubmit}
				courseOptions={courseOptions}
			/>
			{isLoading ? (
				<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
				) : (
				<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Course</TableHead>
								<TableHead>Prerequisite</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{prerequisites.map((p) => (
								<TableRow key={p.id}>
									<TableCell>{getCourseLabel(p.course_id)}</TableCell>
									<TableCell>{getCourseLabel(p.prerequisite_course_id)}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											className="text-red-600 hover:text-red-700"
											onClick={() => handleDelete(p.id)}
											aria-label={`Remove prerequisite`}
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
