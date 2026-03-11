'use client'

import { create } from 'zustand'

interface ScheduleState {
	activeScheduleId: string | null
	setActiveScheduleId: (id: string | null) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
	activeScheduleId: null,
	setActiveScheduleId: (activeScheduleId) => set({ activeScheduleId }),
}))
