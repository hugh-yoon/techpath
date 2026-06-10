const DEFAULT_SITE_URL = 'https://techpath-nine.vercel.app'

export function getSiteUrl(): string {
	if (typeof window !== 'undefined') {
		return window.location.origin
	}

	return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
}

export function getAuthCallbackUrl(): string {
	return `${getSiteUrl()}/auth/callback`
}
