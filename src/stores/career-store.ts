'use client'

import { create } from 'zustand'

interface CareerState {
	activeCareerId: string | null
	setActiveCareerId: (id: string | null) => void
}

export const useCareerStore = create<CareerState>((set) => ({
	activeCareerId: null,
	setActiveCareerId: (activeCareerId) => set({ activeCareerId }),
}))
