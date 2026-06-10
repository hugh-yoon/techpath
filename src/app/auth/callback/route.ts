import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

function buildConfirmUrl(
	origin: string,
	status: 'success' | 'error',
	next?: string | null,
) {
	const url = new URL('/auth/confirm-email', origin)
	url.searchParams.set('status', status)
	if (next) {
		url.searchParams.set('next', next)
	}
	return url.toString()
}

export async function GET(request: Request) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get('code')
	const tokenHash = requestUrl.searchParams.get('token_hash')
	const type = requestUrl.searchParams.get('type')
	const next = requestUrl.searchParams.get('next')

	const cookieStore = await cookies()
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options)
					})
				},
			},
		},
	)

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code)
		if (!error) {
			return NextResponse.redirect(
				buildConfirmUrl(requestUrl.origin, 'success', next),
			)
		}
	}

	if (tokenHash && type) {
		const { error } = await supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: type as EmailOtpType,
		})
		if (!error) {
			return NextResponse.redirect(
				buildConfirmUrl(requestUrl.origin, 'success', next),
			)
		}
	}

	return NextResponse.redirect(
		buildConfirmUrl(requestUrl.origin, 'error', next),
	)
}
