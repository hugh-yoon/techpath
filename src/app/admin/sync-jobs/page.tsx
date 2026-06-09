'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BackLink } from '@/components/ui/back-link'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { SyncJob } from '@/types'
import { cn } from '@/lib/utils'

function formatJobType(jobType: SyncJob['job_type']) {
	return jobType === 'banner_full' ? 'Banner' : 'RMP'
}

function formatMetadata(metadata: Record<string, unknown>) {
	const parts: string[] = []
	if (typeof metadata.termsCompleted === 'number') {
		parts.push(`terms ${metadata.termsCompleted}/2`)
	}
	if (typeof metadata.subjectsProcessed === 'number') {
		parts.push(`${metadata.subjectsProcessed} subjects`)
	}
	if (typeof metadata.sectionsUpserted === 'number') {
		parts.push(`${metadata.sectionsUpserted} sections`)
	}
	if (typeof metadata.instructorsProcessed === 'number') {
		parts.push(`${metadata.instructorsProcessed} instructors`)
	}
	if (typeof metadata.reviewsUpserted === 'number') {
		parts.push(`${metadata.reviewsUpserted} reviews`)
	}
	return parts.length > 0 ? parts.join(' · ') : '—'
}

export default function AdminSyncJobsPage() {
	const [jobs, setJobs] = useState<SyncJob[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const { data, error: e } = await supabase
			.from('sync_jobs')
			.select('*')
			.order('started_at', { ascending: false })
			.limit(50)
		if (e) {
			setError(e as Error)
			setJobs([])
		} else {
			setJobs((data ?? []) as SyncJob[])
		}
		setIsLoading(false)
	}, [])

	useEffect(() => {
		load()
	}, [load])

	return (
		<div>
			<BackLink href="/admin">Admin</BackLink>
			<h1 className="mt-4 text-xl font-semibold">Sync jobs</h1>
			<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
				Recent Banner and RMP ingestion runs.
			</p>

			{error && (
				<p className="mt-4 text-sm text-destructive" role="alert">
					{error.message}
				</p>
			)}

			{isLoading ? (
				<p className="mt-6 text-sm text-gt-gray-matter">Loading…</p>
			) : (
				<Table className="mt-6">
					<TableHeader>
						<TableRow>
							<TableHead>Started</TableHead>
							<TableHead>Job</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Upserted</TableHead>
							<TableHead>Failed</TableHead>
							<TableHead>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{jobs.map((job) => (
							<TableRow key={job.id}>
								<TableCell className="whitespace-nowrap text-sm">
									{new Date(job.started_at).toLocaleString()}
								</TableCell>
								<TableCell>{formatJobType(job.job_type)}</TableCell>
								<TableCell>
									<span
										className={cn(
											'rounded px-2 py-0.5 text-xs font-medium',
											job.status === 'success' &&
												'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
											job.status === 'failed' &&
												'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
											job.status === 'running' &&
												'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
										)}
									>
										{job.status}
									</span>
								</TableCell>
								<TableCell>{job.records_upserted}</TableCell>
								<TableCell>{job.records_failed}</TableCell>
								<TableCell className="max-w-xs truncate text-sm text-gt-gray-matter">
									{job.error_summary ?? formatMetadata(job.metadata)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
