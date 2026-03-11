'use client'

import { useMemo } from 'react'
import { useAllPrerequisites } from './use-prerequisites'

/**
 * Returns a map of course_id -> prerequisite_course_id[] for validation.
 */
export function usePrerequisiteMap(): Map<string, string[]> {
	const { data: prerequisites } = useAllPrerequisites()
	return useMemo(() => {
		const map = new Map<string, string[]>()
		for (const p of prerequisites) {
			const list = map.get(p.course_id) ?? []
			if (!list.includes(p.prerequisite_course_id)) {
				list.push(p.prerequisite_course_id)
			}
			map.set(p.course_id, list)
		}
		return map
	}, [prerequisites])
}
