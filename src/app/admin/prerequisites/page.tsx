'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAllPrerequisites } from '@/hooks/use-prerequisites'
import { useCourses } from '@/hooks/use-courses'
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
import { PrerequisiteFormDialog } from '@/components/admin/prerequisite-form-dialog'
import type { PrerequisiteFormValues } from '@/lib/validations'

export default function AdminPrerequisitesPage() {
	const { data: prerequisites, isLoading, error, refetch } = useAllPrerequisites()
	const { data: courses } = useCourses()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [search, setSearch] = useState('')

	const courseOptions = useMemo(
		() =>
			courses.map((c) => ({
				id: c.id,
				label: `${c.department} ${c.course_number} – ${c.course_name}`,
			})),
		[courses],
	)

	const courseById = useMemo(
		() => new Map(courses.map((c) => [c.id, c])),
		[courses],
	)

	const getCourseLabel = useCallback(
		(id: string) => {
			const c = courseById.get(id)
			return c ? `${c.department} ${c.course_number}` : id
		},
		[courseById],
	)

	const { page, setPage, pageItems, totalCount, pageSize } = useClientTable({
		items: prerequisites,
		searchQuery: search,
		searchFn: (row, query) => {
			const course = getCourseLabel(row.course_id).toLowerCase()
			const prereq = getCourseLabel(row.prerequisite_course_id).toLowerCase()
			return course.includes(query) || prereq.includes(query)
		},
	})

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
			<AdminTableToolbar
				searchId="prerequisite-search"
				searchLabel="Search"
				searchPlaceholder="Course or prerequisite"
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={totalCount}
			/>
			<PrerequisiteFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmit={handleSubmit}
				courseOptions={courseOptions}
			/>
			{isLoading ? (
				<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">Loading…</p>
			) : (
				<>
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
								{pageItems.map((p) => (
									<TableRow key={p.id}>
										<TableCell>{getCourseLabel(p.course_id)}</TableCell>
										<TableCell>{getCourseLabel(p.prerequisite_course_id)}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700"
												onClick={() => handleDelete(p.id)}
												aria-label="Remove prerequisite"
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
						ariaLabel="Prerequisites pagination"
					/>
				</>
			)}
		</div>
	)
}
