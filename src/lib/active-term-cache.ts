import { fetchActiveTermIds } from '@/lib/active-term-ids'

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedIds: string[] | null = null
let cachedAt = 0
let inflight: Promise<string[]> | null = null

/** Cached active term IDs — shared across search, sections, and admin stats. */
export async function getCachedActiveTermIds(): Promise<string[]> {
	const now = Date.now()
	if (cachedIds && now - cachedAt < CACHE_TTL_MS) {
		return cachedIds
	}

	if (inflight) return inflight

	inflight = fetchActiveTermIds()
		.then((ids) => {
			cachedIds = ids
			cachedAt = Date.now()
			return ids
		})
		.finally(() => {
			inflight = null
		})

	return inflight
}

export function invalidateActiveTermCache() {
	cachedIds = null
	cachedAt = 0
}
