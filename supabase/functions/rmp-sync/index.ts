/** Daily job: sync teacher ratings, reviews, and difficulty from Rate My Professors. */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import {
	createServiceClient,
	finishSyncJob,
	startSyncJob,
} from '../_shared/db.ts'
import { runRmpSync } from '../_shared/rmp-sync.ts'

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

	const supabase = createServiceClient()
	const jobId = await startSyncJob(supabase, 'rmp_daily')

	let options = {}
	try {
		const body = await req.json()
		if (Array.isArray(body?.instructorIds)) {
			options = {
				instructorIds: body.instructorIds.filter(
					(id: unknown) => typeof id === 'string' && id.length > 0,
				),
			}
		}
		if (typeof body?.batchSize === 'number') {
			options = { ...options, batchSize: Math.max(1, body.batchSize) }
		}
	} catch {
		options = {}
	}

	try {
		const result = await runRmpSync(supabase, options)
		await finishSyncJob(supabase, jobId, {
			status: 'success',
			recordsUpserted: result.reviewsUpserted + result.matchesLinked,
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
