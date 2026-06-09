/** Monthly job: sync course & section info from GT Banner (current + next term). */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { runBannerSync } from '../_shared/banner-sync.ts'
import {
	createServiceClient,
	finishSyncJob,
	startSyncJob,
} from '../_shared/db.ts'

serve(async (req) => {
	if (req.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 })
	}

	const cronSecret = Deno.env.get('CRON_SECRET')
	if (cronSecret) {
		const auth = req.headers.get('Authorization')
		if (auth !== `Bearer ${cronSecret}`) {
			return new Response('Unauthorized', { status: 401 })
		}
	}

	let reset = false
	let subjects: string[] | undefined
	let subjectSectionOffset = 0
	let subjectSectionLimit: number | undefined
	try {
		const body = await req.json()
		reset = body?.reset === true
		if (Array.isArray(body?.subjects)) {
			subjects = body.subjects
				.map((value: unknown) => String(value).trim().toUpperCase())
				.filter(Boolean)
		}
		if (typeof body?.subjectSectionOffset === 'number') {
			subjectSectionOffset = Math.max(0, body.subjectSectionOffset)
		}
		if (typeof body?.subjectSectionLimit === 'number') {
			subjectSectionLimit = Math.max(1, body.subjectSectionLimit)
		}
	} catch {
		reset = false
		subjects = undefined
	}

	const supabase = createServiceClient()
	const jobId = await startSyncJob(supabase, 'banner_full')

	try {
		const result = await runBannerSync(supabase, {
			reset,
			subjects,
			subjectSectionOffset,
			subjectSectionLimit,
		})
		await finishSyncJob(supabase, jobId, {
			status: 'success',
			recordsUpserted: result.sectionsUpserted,
			recordsFailed: result.failures,
			metadata: result,
		})
		return Response.json({ ok: true, ...result })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		await finishSyncJob(supabase, jobId, {
			status: 'failed',
			recordsUpserted: 0,
			recordsFailed: 1,
			errorSummary: message,
		})
		return Response.json({ ok: false, error: message }, { status: 500 })
	}
})
