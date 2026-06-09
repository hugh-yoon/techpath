'use client'

import { useCallback, useEffect, useState } from 'react'
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
import type { InstructorRmpCandidate } from '@/types'

interface CandidateRow extends InstructorRmpCandidate {
	instructor?: { name: string; department: string } | null
}

export default function AdminRmpMatchesPage() {
	const [rows, setRows] = useState<CandidateRow[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data, error: e } = await supabase
			.from('instructor_rmp_candidates')
			.select(
				'id, instructor_id, rmp_professor_id, rmp_name, rmp_department, match_confidence, status, created_at, instructor:instructors(name, department)',
			)
			.in('status', ['pending', 'auto_matched'])
			.order('match_confidence', { ascending: false })

		if (e) {
			setError(e as Error)
			setIsLoading(false)
			return
		}

		const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
			...row,
			instructor: Array.isArray(row.instructor)
				? row.instructor[0]
				: row.instructor,
		})) as CandidateRow[]

		setRows(mapped)
		setIsLoading(false)
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const handleApprove = async (row: CandidateRow) => {
		await supabase
			.from('instructors')
			.update({ rmp_professor_id: row.rmp_professor_id })
			.eq('id', row.instructor_id)
		await supabase
			.from('instructor_rmp_candidates')
			.update({ status: 'approved' })
			.eq('id', row.id)
		await load()
	}

	const handleReject = async (row: CandidateRow) => {
		await supabase
			.from('instructor_rmp_candidates')
			.update({ status: 'rejected' })
			.eq('id', row.id)
		await load()
	}

	return (
		<div className="space-y-6">
			<BackLink href="/admin">Admin</BackLink>
			<div>
				<h1 className="text-2xl font-bold text-gt-navy">RMP Matches</h1>
				<p className="mt-1 text-sm text-gt-gray-matter">
					Review low-confidence Rate My Professors links between Banner
					instructors and RMP profiles.
				</p>
			</div>

			{error && (
				<p className="text-sm text-red-600" role="alert">
					{error.message}
				</p>
			)}

			{isLoading ? (
				<p className="text-sm text-gt-gray-matter">Loading…</p>
			) : rows.length === 0 ? (
				<p className="text-sm text-gt-gray-matter">
					No pending matches. High-confidence links are applied
					automatically during the daily RMP sync.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Banner instructor</TableHead>
							<TableHead>RMP name</TableHead>
							<TableHead>Department</TableHead>
							<TableHead>Confidence</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>
									{row.instructor?.name ?? row.instructor_id}
								</TableCell>
								<TableCell>{row.rmp_name}</TableCell>
								<TableCell>
									{row.rmp_department ?? '—'}
								</TableCell>
								<TableCell>
									{Math.round(row.match_confidence * 100)}%
								</TableCell>
								<TableCell>{row.status}</TableCell>
								<TableCell className="space-x-2 text-right">
									<Button
										size="sm"
										onClick={() => handleApprove(row)}
										aria-label={`Approve match for ${row.rmp_name}`}
									>
										Approve
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleReject(row)}
										aria-label={`Reject match for ${row.rmp_name}`}
									>
										Reject
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
