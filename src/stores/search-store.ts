'use client'

import { create } from 'zustand'
import type { CourseSearchFilters } from '@/hooks/use-courses'

interface SearchState {
	query: string
	filters: CourseSearchFilters
	setQuery: (q: string) => void
	setFilters: (f: Partial<CourseSearchFilters>) => void
	reset: () => void
}

const defaultFilters: CourseSearchFilters = {}

export const useSearchStore = create<SearchState>((set) => ({
	query: '',
	filters: defaultFilters,
	setQuery: (query) => set({ query }),
	setFilters: (filters) =>
		set((s) => ({ filters: { ...s.filters, ...filters } })),
	reset: () => set({ query: '', filters: defaultFilters }),
}))
