'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-provider'

export function GuestPlanBanner() {
	const { isAuthenticated, isLoading } = useAuth()
	const pathname = usePathname() ?? '/'

	if (isLoading || isAuthenticated) return null

	const guestRoutes = ['/schedule', '/career', '/path-builder']
	if (!guestRoutes.some((route) => pathname.startsWith(route))) {
		return null
	}

	return (
		<div
			className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
			role="status"
		>
			<p>
				You&apos;re browsing without an account. Schedules and career plans are
				stored temporarily in this browser session.{' '}
				<Link
					href={`/auth/sign-up?redirect=${encodeURIComponent(pathname)}`}
					className="font-semibold underline underline-offset-2"
				>
					Create an account
				</Link>
				{' '}to save them permanently.
			</p>
		</div>
	)
}
