import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up']

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request })

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value)
					})
					supabaseResponse = NextResponse.next({ request })
					cookiesToSet.forEach(({ name, value, options }) => {
						supabaseResponse.cookies.set(name, value, options)
					})
				},
			},
		},
	)

	const {
		data: { user },
	} = await supabase.auth.getUser()

	const pathname = request.nextUrl.pathname
	const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

	if (user && isAuthRoute) {
		const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/'
		return NextResponse.redirect(new URL(redirectTo, request.url))
	}

	if (pathname.startsWith('/discovery') && !user) {
		const signInUrl = new URL('/auth/sign-in', request.url)
		signInUrl.searchParams.set('redirect', pathname)
		return NextResponse.redirect(signInUrl)
	}

	if (pathname.startsWith('/admin')) {
		if (!user) {
			const signInUrl = new URL('/auth/sign-in', request.url)
			signInUrl.searchParams.set('redirect', pathname)
			return NextResponse.redirect(signInUrl)
		}

		const { data: profile } = await supabase
			.from('profiles')
			.select('is_admin')
			.eq('id', user.id)
			.maybeSingle()

		if (!profile?.is_admin) {
			return NextResponse.redirect(new URL('/', request.url))
		}
	}

	return supabaseResponse
}

export const config = {
	matcher: [
		'/discovery/:path*',
		'/admin/:path*',
		'/auth/sign-in',
		'/auth/sign-up',
	],
}
