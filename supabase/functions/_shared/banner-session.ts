const BANNER_ORIGIN =
	'https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb'

export class BannerSession {
	private cookieJar = new Map<string, string>()

	private get cookieHeader(): string {
		return [...this.cookieJar.entries()]
			.map(([k, v]) => `${k}=${v}`)
			.join('; ')
	}

	private storeCookies(header: string | null) {
		if (!header) return
		for (const part of header.split(',')) {
			const [pair] = part.split(';')
			const eq = pair.indexOf('=')
			if (eq === -1) continue
			const name = pair.slice(0, eq).trim()
			const value = pair.slice(eq + 1).trim()
			if (name) this.cookieJar.set(name, value)
		}
	}

	async fetch(path: string, init: RequestInit = {}): Promise<Response> {
		const url = path.startsWith('http') ? path : `${BANNER_ORIGIN}/${path}`
		const headers = new Headers(init.headers)
		if (this.cookieHeader) headers.set('Cookie', this.cookieHeader)
		headers.set('Accept', 'application/json, text/plain, */*')

		const res = await fetch(url, { ...init, headers })
		this.storeCookies(res.headers.get('set-cookie'))
		return res
	}

	async initTerm(termCode: string): Promise<void> {
		const body = new URLSearchParams({
			term: termCode,
			studyPath: '',
			studyPathText: '',
			startDatepicker: '',
			endDatepicker: '',
		})
		const res = await this.fetch('term/search?mode=search', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		})
		if (!res.ok) {
			throw new Error(`Banner term/search failed: ${res.status}`)
		}
	}
}
