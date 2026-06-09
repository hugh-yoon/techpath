export interface SyncTriggerResult {
	ok?: boolean
	error?: string
	sectionsUpserted?: number
	instructorsProcessed?: number
	matchesLinked?: number
	reviewsUpserted?: number
	failures?: number
	subjectsProcessed?: number
	termsSynced?: number
	termsCompleted?: number
}

async function postSync(
	path: string,
	body?: Record<string, unknown>,
): Promise<SyncTriggerResult> {
	const response = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	})
	const payload = (await response.json().catch(() => ({}))) as SyncTriggerResult
	if (!response.ok) {
		throw new Error(payload.error ?? `Sync failed (${response.status})`)
	}
	return payload
}

export function triggerBannerSyncBatch() {
	return postSync('/api/admin/sync/banner', {})
}

export function triggerBannerSyncReset() {
	return postSync('/api/admin/sync/banner', { reset: true })
}

export function triggerBannerSubjectResync(subjects: string[]) {
	return postSync('/api/admin/sync/banner', { subjects })
}

export async function triggerBannerSubjectResyncAll(
	subjects: string[],
): Promise<SyncTriggerResult> {
	const sectionLimit = 200
	let offset = 0
	let aggregate: SyncTriggerResult = { ok: true, sectionsUpserted: 0, failures: 0 }
	let iterations = 0

	while (iterations < 40) {
		const result = await postSync('/api/admin/sync/banner', {
			subjects,
			subjectSectionOffset: offset,
			subjectSectionLimit: sectionLimit,
		})
		aggregate = {
			ok: result.ok,
			sectionsUpserted:
				(aggregate.sectionsUpserted ?? 0) + (result.sectionsUpserted ?? 0),
			failures: (aggregate.failures ?? 0) + (result.failures ?? 0),
			subjectsProcessed: result.subjectsProcessed,
		}
		const complete = (result as Record<string, unknown>).subjectResyncComplete
		if (complete !== false) break
		offset += sectionLimit
		iterations++
	}

	return aggregate
}

export function triggerRmpSync() {
	return postSync('/api/admin/sync/rmp')
}

export async function triggerRmpSyncAll(
	maxBatches = 12,
): Promise<SyncTriggerResult> {
	let aggregate: SyncTriggerResult = {
		ok: true,
		instructorsProcessed: 0,
		matchesLinked: 0,
		reviewsUpserted: 0,
		failures: 0,
	}

	for (let i = 0; i < maxBatches; i++) {
		const result = await postSync('/api/admin/sync/rmp', { batchSize: 100 })
		aggregate = {
			ok: result.ok,
			instructorsProcessed:
				(aggregate.instructorsProcessed ?? 0) +
				(result.instructorsProcessed ?? 0),
			matchesLinked:
				(aggregate.matchesLinked ?? 0) + (result.matchesLinked ?? 0),
			reviewsUpserted:
				(aggregate.reviewsUpserted ?? 0) + (result.reviewsUpserted ?? 0),
			failures: (aggregate.failures ?? 0) + (result.failures ?? 0),
		}
		if ((result.instructorsProcessed ?? 0) === 0) break
		if ((result.matchesLinked ?? 0) === 0 && (result.failures ?? 0) === 0) {
			break
		}
	}

	return aggregate
}
