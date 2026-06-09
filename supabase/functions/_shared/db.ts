import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

function getServiceRoleKey(): string | undefined {
	const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
	if (legacy) return legacy

	const secretKeysJson = Deno.env.get('SUPABASE_SECRET_KEYS')
	if (!secretKeysJson) return undefined

	try {
		const secretKeys = JSON.parse(secretKeysJson) as Record<string, string>
		return secretKeys.default ?? Object.values(secretKeys)[0]
	} catch {
		return undefined
	}
}

export function createServiceClient(): SupabaseClient {
	const url = Deno.env.get('SUPABASE_URL')
	const key = getServiceRoleKey()
	if (!url || !key) {
		throw new Error(
			'Missing SUPABASE_URL or service role key (auto-injected on hosted Supabase)',
		)
	}
	return createClient(url, key)
}

export async function startSyncJob(
	supabase: SupabaseClient,
	jobType: 'banner_full' | 'rmp_daily',
) {
	const { data, error } = await supabase
		.from('sync_jobs')
		.insert({ job_type: jobType, status: 'running' })
		.select('id')
		.single()
	if (error) throw error
	return data.id as string
}

export async function finishSyncJob(
	supabase: SupabaseClient,
	jobId: string,
	result: {
		status: 'success' | 'failed'
		recordsUpserted: number
		recordsFailed: number
		errorSummary?: string
		metadata?: Record<string, unknown>
	},
) {
	const { error } = await supabase
		.from('sync_jobs')
		.update({
			status: result.status,
			completed_at: new Date().toISOString(),
			records_upserted: result.recordsUpserted,
			records_failed: result.recordsFailed,
			error_summary: result.errorSummary ?? null,
			metadata: result.metadata ?? {},
		})
		.eq('id', jobId)
	if (error) throw error
}
