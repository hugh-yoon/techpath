interface RangeResult<T> {
	data: T[] | null
	error: { message: string } | null
}

interface RangeQuery<T> {
	range: (from: number, to: number) => PromiseLike<RangeResult<T>>
}

/** Fetch all rows from a Supabase query, paginating past the 1,000-row default. */
export async function fetchAllPaginated<T>(
	buildQuery: () => RangeQuery<T>,
	pageSize = 1000,
): Promise<T[]> {
	const rows: T[] = []
	let from = 0

	while (true) {
		const { data, error } = await buildQuery().range(from, from + pageSize - 1)
		if (error) throw new Error(error.message)
		if (!data?.length) break
		rows.push(...data)
		if (data.length < pageSize) break
		from += pageSize
	}

	return rows
}
