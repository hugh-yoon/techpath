'use client'

import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 25

export interface ClientTableFilter {
	id: string
	value: string
}

interface UseClientTableOptions<T> {
	items: T[]
	pageSize?: number
	searchQuery?: string
	searchFn?: (item: T, query: string) => boolean
	filters?: ClientTableFilter[]
	filterFn?: (item: T, filters: ClientTableFilter[]) => boolean
}

export function useClientTable<T>({
	items,
	pageSize = DEFAULT_PAGE_SIZE,
	searchQuery = '',
	searchFn,
	filters = [],
	filterFn,
}: UseClientTableOptions<T>) {
	const [page, setPage] = useState(0)

	const filteredItems = useMemo(() => {
		const needle = searchQuery.trim().toLowerCase()
		return items.filter((item) => {
			if (needle && searchFn && !searchFn(item, needle)) return false
			if (filterFn && !filterFn(item, filters)) return false
			return true
		})
	}, [items, searchQuery, searchFn, filters, filterFn])

	useEffect(() => {
		setPage(0)
	}, [searchQuery, filters, pageSize, items.length])

	const totalCount = filteredItems.length
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
	const safePage = Math.min(page, totalPages - 1)
	const pageItems = useMemo(() => {
		const start = safePage * pageSize
		return filteredItems.slice(start, start + pageSize)
	}, [filteredItems, safePage, pageSize])

	return {
		page: safePage,
		setPage,
		pageItems,
		totalCount,
		pageSize,
		totalPages,
	}
}
