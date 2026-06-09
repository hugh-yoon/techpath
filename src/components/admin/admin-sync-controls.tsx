'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	triggerBannerSubjectResyncAll,
	triggerBannerSyncBatch,
	triggerBannerSyncReset,
	triggerRmpSync,
	triggerRmpSyncAll,
	type SyncTriggerResult,
} from '@/lib/admin-sync'

interface SyncAction {
	id: string
	label: string
	description: string
	run: () => Promise<SyncTriggerResult>
}

const SYNC_ACTIONS: SyncAction[] = [
	{
		id: 'banner-batch',
		label: 'Banner batch',
		description: 'Run the next scheduled Banner batch (3 subjects).',
		run: triggerBannerSyncBatch,
	},
	{
		id: 'banner-cs',
		label: 'Banner CS + CSE',
		description: 'Re-sync Computer Science subjects from Banner immediately.',
		run: () => triggerBannerSubjectResyncAll(['CS', 'CSE']),
	},
	{
		id: 'banner-reset',
		label: 'Banner reset',
		description: 'Reset Banner offsets and start a full term re-pull.',
		run: triggerBannerSyncReset,
	},
	{
		id: 'rmp',
		label: 'RMP batch',
		description: 'Run one RMP enrichment batch for schedule instructors.',
		run: triggerRmpSync,
	},
	{
		id: 'rmp-all',
		label: 'RMP sync all',
		description: 'Run multiple RMP batches until instructors are processed.',
		run: () => triggerRmpSyncAll(),
	},
]

function formatSyncResult(result: SyncTriggerResult): string {
	const parts: string[] = []
	if (typeof result.sectionsUpserted === 'number') {
		parts.push(`${result.sectionsUpserted} sections upserted`)
	}
	if (typeof result.subjectsProcessed === 'number') {
		parts.push(`${result.subjectsProcessed} subjects processed`)
	}
	if (typeof result.instructorsProcessed === 'number') {
		parts.push(`${result.instructorsProcessed} instructors processed`)
	}
	if (typeof result.reviewsUpserted === 'number') {
		parts.push(`${result.reviewsUpserted} reviews upserted`)
	}
	if (typeof result.matchesLinked === 'number') {
		parts.push(`${result.matchesLinked} RMP matches linked`)
	}
	if (typeof result.failures === 'number' && result.failures > 0) {
		parts.push(`${result.failures} failures`)
	}
	return parts.length > 0 ? parts.join(' · ') : 'Sync completed'
}

export function AdminSyncControls({
	onComplete,
}: {
	onComplete?: () => void
}) {
	const [runningId, setRunningId] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleRun = useCallback(
		async (action: SyncAction) => {
			setRunningId(action.id)
			setError(null)
			setMessage(null)
			try {
				const result = await action.run()
				setMessage(`${action.label}: ${formatSyncResult(result)}`)
				onComplete?.()
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Sync failed')
			} finally {
				setRunningId(null)
			}
		},
		[onComplete],
	)

	return (
		<section
			className="mt-8 rounded-xl border-2 border-gt-navy/10 bg-gt-white p-5 dark:border-gt-gray-matter dark:bg-surface"
			aria-labelledby="manual-sync-heading"
		>
			<h2
				id="manual-sync-heading"
				className="text-base font-semibold text-gt-navy dark:text-foreground"
			>
				Manual sync jobs
			</h2>
			<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
				Trigger Banner or RMP ingestion outside the daily cron schedule.
				Results also appear on{' '}
				<a href="/admin/sync-jobs" className="underline">
					Sync Jobs
				</a>
				.
			</p>

			<div className="mt-4 flex flex-wrap gap-2">
				{SYNC_ACTIONS.map((action) => (
					<Button
						key={action.id}
						type="button"
						variant={action.id === 'banner-reset' ? 'outline' : 'default'}
						size="sm"
						disabled={runningId != null}
						onClick={() => handleRun(action)}
						title={action.description}
						aria-label={action.description}
					>
						{runningId === action.id ? 'Running…' : action.label}
					</Button>
				))}
			</div>

			{message && (
				<p className="mt-3 text-sm text-gt-navy dark:text-foreground" role="status">
					{message}
				</p>
			)}
			{error && (
				<p className="mt-3 text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
		</section>
	)
}
