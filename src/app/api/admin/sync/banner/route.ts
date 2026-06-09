import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	const cronSecret = process.env.CRON_SECRET
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

	if (!cronSecret || !supabaseUrl) {
		return NextResponse.json(
			{ error: 'CRON_SECRET and NEXT_PUBLIC_SUPABASE_URL must be configured' },
			{ status: 503 },
		)
	}

	let body: Record<string, unknown> = {}
	try {
		body = await request.json()
	} catch {
		body = {}
	}

	const response = await fetch(`${supabaseUrl}/functions/v1/banner-sync`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${cronSecret}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})

	const payload = await response.json().catch(() => ({
		error: 'Invalid response from banner-sync',
	}))

	return NextResponse.json(payload, { status: response.status })
}
