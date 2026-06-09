'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminSectionsPage } from '@/hooks/use-admin-sections-page'
import { useCourses } from '@/hooks/use-courses'
import { useInstructors } from '@/hooks/use-instructors'
import { supabase } from '@/lib/supabaseClient'
import { BackLink } from '@/components/ui/back-link'
import { Button } from '@/components/ui/button'
import { DataPagination } from '@/components/ui/data-pagination'
import { AdminTableToolbar } from '@/components/admin/admin-table-toolbar'
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
	const { data: courses } = useCourses()
	const { data: instructors } = useInstructors()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingSection, setEditingSection] = useState<Section | null>(null)
	const [search, setSearch] = useState('')
	const [courseFilter, setCourseFilter] = useState('__all__')
	const [instructorFilter, setInstructorFilter] = useState('__all__')
	const [activeFilter, setActiveFilter] = useState('__all__')
	const [page, setPage] = useState(0)

	useEffect(() => {
		setPage(0)
	}, [search, courseFilter, instructorFilter, activeFilter])

	const {
		data: sections,
		totalCount,
		pageSize,
		isLoading,
		error,
		refetch,
	} = useAdminSectionsPage({
		page,
		search,
		courseId: courseFilter === '__all__' ? undefined : courseFilter,
		instructorId: instructorFilter === '__all__' ? undefined : instructorFilter,
		activeOnly: activeFilter === 'active',
	})

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

	const courseById = useMemo(
		() => new Map(courses.map((c) => [c.id, c])),
		[courses],
	)
	const instructorById = useMemo(
		() => new Map(instructors.map((i) => [i.id, i])),
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
			<AdminTableToolbar
				searchId="section-search"
				searchLabel="Search"
				searchPlaceholder="CRN or section code"
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={totalCount}
				filters={[
					{
						id: 'course-filter',
						label: 'Course',
						value: courseFilter,
						onChange: setCourseFilter,
						options: [
							{ value: '__all__', label: 'All courses' },
							...courseOptions.map((c) => ({
								value: c.id,
								label: c.label,
							})),
						],
					},
					{
						id: 'instructor-filter',
						label: 'Instructor',
						value: instructorFilter,
						onChange: setInstructorFilter,
						options: [
							{ value: '__all__', label: 'All instructors' },
							...instructorOptions.map((i) => ({
								value: i.id,
								label: i.label,
							})),
						],
					},
					{
						id: 'active-filter',
						label: 'Status',
						value: activeFilter,
						onChange: setActiveFilter,
						options: [
							{ value: '__all__', label: 'All sections' },
							{ value: 'active', label: 'Active only' },
						],
					},
				]}
			/>
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
				<>
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
									<TableHead>Active</TableHead>
									<TableHead className="w-[120px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sections.map((s) => {
									const course = courseById.get(s.course_id)
									const instructor = instructorById.get(s.instructor_id)
									return (
										<TableRow key={s.id}>
											<TableCell>{s.crn}</TableCell>
											<TableCell>
												{course
													? `${course.department} ${course.course_number}`
													: s.course_id}
											</TableCell>
											<TableCell>{s.section_code}</TableCell>
											<TableCell>{instructor?.name ?? '—'}</TableCell>
											<TableCell>{formatDaysShort(s.day_pattern)}</TableCell>
											<TableCell>
												{formatTimeDisplay(s.start_time)} –{' '}
												{formatTimeDisplay(s.end_time)}
											</TableCell>
											<TableCell>{s.is_active ? 'Yes' : 'No'}</TableCell>
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
									)
								})}
							</TableBody>
						</Table>
					</div>
					<DataPagination
						page={page}
						totalCount={totalCount}
						pageSize={pageSize}
						onPageChange={setPage}
						ariaLabel="Sections pagination"
					/>
				</>
			)}
		</div>
	)
}
