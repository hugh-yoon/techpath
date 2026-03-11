'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSections } from '@/hooks/use-sections'
import { useCourses } from '@/hooks/use-courses'
import { useInstructors } from '@/hooks/use-instructors'
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
import { SectionFormDialog } from '@/components/admin/section-form-dialog'
import type { Section } from '@/types'
import type { SectionFormValues } from '@/lib/validations'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'

export default function AdminSectionsPage() {
	const { data: sections, isLoading, error, refetch } = useSections()
	const { data: courses } = useCourses()
	const { data: instructors } = useInstructors()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingSection, setEditingSection] = useState<Section | null>(null)

	const courseOptions = useMemo(
		() =>
			courses.map((c) => ({
				id: c.id,
				label: `${c.department} ${c.course_number} – ${c.course_name}`,
			})),
		[courses],
	)
	const instructorOptions = useMemo(
		() => instructors.map((i) => ({ id: i.id, label: i.name })),
		[instructors],
	)

	const handleCreate = useCallback(() => {
		setEditingSection(null)
		setDialogOpen(true)
	}, [])

	const handleEdit = useCallback((section: Section) => {
		setEditingSection(section)
		setDialogOpen(true)
	}, [])

	const handleSubmit = useCallback(
		async (values: SectionFormValues) => {
			const payload = {
				course_id: values.course_id,
				instructor_id: values.instructor_id,
				section_code: values.section_code,
				day_pattern: values.day_pattern,
				start_time: values.start_time + ':00',
				end_time: values.end_time + ':00',
				location: values.location,
				crn: values.crn,
			}
			if (editingSection) {
				await supabase.from('sections').update(payload).eq('id', editingSection.id)
			} else {
				await supabase.from('sections').insert(payload)
			}
			await refetch()
		},
		[editingSection, refetch],
	)

	const handleDelete = useCallback(
		async (id: string) => {
			if (!confirm('Delete this section?')) return
			await supabase.from('sections').delete().eq('id', id)
			await refetch()
		},
		[refetch],
	)

	if (error) {
		return (
			<div>
				<h1 className="text-xl font-semibold">Sections</h1>
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
				<h1 className="text-xl font-semibold">Sections</h1>
				<Button onClick={handleCreate}>Add Section</Button>
			</div>
			<SectionFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmit={handleSubmit}
				section={editingSection}
				courseOptions={courseOptions}
				instructorOptions={instructorOptions}
			/>
			{isLoading ? (
				<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
				) : (
				<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>CRN</TableHead>
								<TableHead>Course</TableHead>
								<TableHead>Section</TableHead>
								<TableHead>Instructor</TableHead>
								<TableHead>Days</TableHead>
								<TableHead>Time</TableHead>
								<TableHead className="w-[120px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sections.map((s) => (
								<TableRow key={s.id}>
									<TableCell>{s.crn}</TableCell>
									<TableCell>
										{courses.find((c) => c.id === s.course_id)?.department}{' '}
										{courses.find((c) => c.id === s.course_id)?.course_number}
									</TableCell>
									<TableCell>{s.section_code}</TableCell>
									<TableCell>
										{instructors.find((i) => i.id === s.instructor_id)?.name ??
											'—'}
									</TableCell>
									<TableCell>{formatDaysShort(s.day_pattern)}</TableCell>
									<TableCell>
										{formatTimeDisplay(s.start_time)} –{' '}
										{formatTimeDisplay(s.end_time)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(s)}
											aria-label={`Edit section ${s.crn}`}
										>
											Edit
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-red-600 hover:text-red-700"
											onClick={() => handleDelete(s.id)}
											aria-label={`Delete section ${s.crn}`}
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
