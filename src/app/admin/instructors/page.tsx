'use client'

import { useMemo, useState, useCallback } from 'react'
import { useInstructors } from '@/hooks/use-instructors'
import { useClientTable } from '@/hooks/use-client-table'
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
import { InstructorFormDialog } from '@/components/admin/instructor-form-dialog'
import type { Instructor } from '@/types'
import type { InstructorFormValues } from '@/lib/validations'

export default function AdminInstructorsPage() {
	const { data: instructors, isLoading, error, refetch } = useInstructors()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
	const [search, setSearch] = useState('')
	const [departmentFilter, setDepartmentFilter] = useState('__all__')

	const departments = useMemo(
		() => [...new Set(instructors.map((i) => i.department))].sort(),
		[instructors],
	)

	const { page, setPage, pageItems, totalCount, pageSize } = useClientTable({
		items: instructors,
		searchQuery: search,
		searchFn: (instructor, query) =>
			instructor.name.toLowerCase().includes(query)
			|| instructor.department.toLowerCase().includes(query),
		filters: [{ id: 'department', value: departmentFilter }],
		filterFn: (instructor, filters) => {
			const dept = filters.find((f) => f.id === 'department')?.value
			if (!dept || dept === '__all__') return true
			return instructor.department === dept
		},
	})

	const handleCreate = useCallback(() => {
		setEditingInstructor(null)
		setDialogOpen(true)
	}, [])

	const handleEdit = useCallback((instructor: Instructor) => {
		setEditingInstructor(instructor)
		setDialogOpen(true)
	}, [])

	const handleSubmit = useCallback(
		async (values: InstructorFormValues) => {
			if (editingInstructor) {
				await supabase
					.from('instructors')
					.update({
						name: values.name,
						department: values.department,
						rating: values.rating,
						teaching_style: values.teaching_style,
					})
					.eq('id', editingInstructor.id)
			} else {
				await supabase.from('instructors').insert({
					name: values.name,
					department: values.department,
					rating: values.rating,
					teaching_style: values.teaching_style,
				})
			}
			await refetch()
		},
		[editingInstructor, refetch],
	)

	const handleDelete = useCallback(
		async (id: string) => {
			if (!confirm('Delete this instructor?')) return
			await supabase.from('instructors').delete().eq('id', id)
			await refetch()
		},
		[refetch],
	)

	if (error) {
		return (
			<div>
				<h1 className="text-xl font-semibold">Instructors</h1>
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
				<h1 className="text-xl font-semibold">Instructors</h1>
				<Button onClick={handleCreate}>Add Instructor</Button>
			</div>
			<AdminTableToolbar
				searchId="instructor-search"
				searchLabel="Search"
				searchPlaceholder="Name or department"
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={totalCount}
				filters={[
					{
						id: 'department-filter',
						label: 'Department',
						value: departmentFilter,
						onChange: setDepartmentFilter,
						options: [
							{ value: '__all__', label: 'All departments' },
							...departments.map((d) => ({ value: d, label: d })),
						],
					},
				]}
			/>
			<InstructorFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmit={handleSubmit}
				instructor={editingInstructor}
			/>
			{isLoading ? (
				<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
			) : (
				<>
					<div className="mt-4 overflow-x-auto rounded-md border border-gt-pi-mile dark:border-gt-gray-matter">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Department</TableHead>
									<TableHead>Rating</TableHead>
									<TableHead>Teaching Style</TableHead>
									<TableHead className="w-[120px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageItems.map((i) => (
									<TableRow key={i.id}>
										<TableCell>{i.name}</TableCell>
										<TableCell>{i.department}</TableCell>
										<TableCell>{i.rating ?? '—'}</TableCell>
										<TableCell>{i.teaching_style ?? '—'}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(i)}
												aria-label={`Edit ${i.name}`}
											>
												Edit
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700"
												onClick={() => handleDelete(i.id)}
												aria-label={`Delete ${i.name}`}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<DataPagination
						page={page}
						totalCount={totalCount}
						pageSize={pageSize}
						onPageChange={setPage}
						ariaLabel="Instructors pagination"
					/>
				</>
			)}
		</div>
	)
}
