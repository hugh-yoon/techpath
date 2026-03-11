import type { DayOfWeek, Semester } from '@/types'

export const DAYS_OF_WEEK: DayOfWeek[] = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
]

export const SEMESTERS: Semester[] = ['Fall', 'Spring', 'Summer']

export const DEPARTMENTS = [
	'AE',
	'BC',
	'BME',
	'CHE',
	'COA',
	'CP',
	'CS',
	'CSE',
	'EAS',
	'ECON',
	'ECE',
	'HTS',
	'ID',
	'ISYE',
	'MGT',
	'MATH',
	'ME',
	'ML',
	'PHYS',
	'PSYC',
	'PUBP',
	'VIP',
] as const

export type DepartmentCode = (typeof DEPARTMENTS)[number]

export const CALENDAR_START_HOUR = 7
export const CALENDAR_END_HOUR = 21
export const CALENDAR_SLOT_MINUTES = 15
export const CALENDAR_TOTAL_ROWS = 56
