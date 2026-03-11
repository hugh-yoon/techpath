'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSchedules, useSchedule } from '@/hooks'
import { BackLink } from '@/components/ui/back-link'
import { useScheduleStore } from '@/stores/schedule-store'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarGrid } from '@/components/schedule/calendar-grid'
import { CreateScheduleDialog } from '@/components/schedule/create-schedule-dialog'
import { formatDaysShort } from '@/utils/days'
import { formatTimeDisplay } from '@/utils/time'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

function ScheduleSidebarItem({
	schedule,
	isActive,
	onSelect,
	onDelete,
	onRename,
}: {
	schedule: Schedule
	isActive: boolean
	onSelect: () => void
	onDelete: () => void
	onRename: (name: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [editName, setEditName] = useState(schedule.name)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (editing) {
			setEditName(schedule.name)
			inputRef.current?.focus()
			inputRef.current?.select()
		}
	}, [editing, schedule.name])

	const handleSubmit = () => {
		const trimmed = editName.trim()
		if (trimmed && trimmed !== schedule.name) onRename(trimmed)
		setEditing(false)
	}

	return (
		<li className="group flex items-center gap-0.5">
			{editing ? (
				<Input
					ref={inputRef}
					value={editName}
					onChange={(e) => setEditName(e.target.value)}
					onBlur={handleSubmit}
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleSubmit()
						if (e.key === 'Escape') setEditing(false)
					}}
					className="h-8 flex-1 text-sm"
					onClick={(e) => e.stopPropagation()}
				/>
			) : (
				<button
					type="button"
					onClick={onSelect}
					onDoubleClick={(e) => {
						e.preventDefault()
						setEditing(true)
					}}
					className={cn(
						'min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors',
						isActive
							? 'bg-gt-tech-gold/30 text-gt-navy dark:bg-gt-tech-gold/40 dark:text-gt-navy'
							: 'text-gt-navy hover:bg-gt-pi-mile dark:text-foreground dark:hover:bg-gt-gray-matter',
					)}
					aria-pressed={isActive}
					title="Double-click to rename"
				>
					{schedule.name} – {schedule.semester} {schedule.year}
				</button>
			)}
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
				onClick={(e) => {
					e.stopPropagation()
					onDelete()
				}}
				aria-label={`Delete ${schedule.name}`}
			>
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</Button>
		</li>
	)
}

export default function SchedulePage() {
	const { data: schedules, isLoading: schedulesLoading, refetch } = useSchedules()
	const activeScheduleId = useScheduleStore((s) => s.activeScheduleId)
	const setActiveScheduleId = useScheduleStore((s) => s.setActiveScheduleId)
	const { data: activeSchedule, isLoading: scheduleLoading } = useSchedule(
		activeScheduleId ?? null,
	)
	const [createOpen, setCreateOpen] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	const handleRemoveSection = useCallback(
		async (scheduleSectionId: string) => {
			if (!confirm('Remove this class from your schedule?')) return
			await supabase.from('schedule_sections').delete().eq('id', scheduleSectionId)
			await refetch()
		},
		[refetch],
	)

	const handleDeleteSchedule = useCallback(
		async (schedule: Schedule) => {
			if (!confirm(`Delete schedule "${schedule.name}"? All classes in it will be removed.`)) return
			await supabase.from('schedules').delete().eq('id', schedule.id)
			if (activeScheduleId === schedule.id) {
				const rest = schedules.filter((s) => s.id !== schedule.id)
				setActiveScheduleId(rest[0]?.id ?? null)
			}
			await refetch()
		},
		[activeScheduleId, schedules, setActiveScheduleId, refetch],
	)

	const handleRenameSchedule = useCallback(
		async (scheduleId: string, name: string) => {
			await supabase.from('schedules').update({ name }).eq('id', scheduleId)
			await refetch()
		},
		[refetch],
	)

	const totalCredits =
		activeSchedule?.schedule_sections?.reduce(
			(sum, ss) => sum + (ss.section?.course?.credit_hours ?? 0),
			0,
		) ?? 0

	useEffect(() => {
		if (schedules.length > 0 && !activeScheduleId) {
			setActiveScheduleId(schedules[0].id)
		}
	}, [schedules, activeScheduleId, setActiveScheduleId])

	return (
		<div className="flex h-[calc(100vh-4rem)] overflow-hidden">
			<aside
				className={cn(
					'flex h-full shrink-0 flex-col overflow-y-auto border-r border-gt-pi-mile bg-gt-diploma transition-[width] duration-200 dark:border-gt-gray-matter dark:bg-surface',
					sidebarCollapsed ? 'w-12 p-2' : 'w-72 p-4',
				)}
			>
				<div className="flex items-center justify-between gap-2">
					{!sidebarCollapsed && (
						<h2 className="text-sm font-semibold uppercase tracking-wide text-gt-gray-matter dark:text-gt-pi-mile">
							Schedules
						</h2>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0"
						onClick={() => setSidebarCollapsed((c) => !c)}
						aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden
						>
							{sidebarCollapsed ? (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							)}
						</svg>
					</Button>
				</div>
				{!sidebarCollapsed && (
					<>
						<Button
							variant="outline"
							size="sm"
							className="mt-2 w-full"
							onClick={() => setCreateOpen(true)}
						>
							Create schedule
						</Button>
						<ul className="mt-3 space-y-1">
							{schedules.map((s) => (
								<ScheduleSidebarItem
									key={s.id}
									schedule={s}
									isActive={activeScheduleId === s.id}
									onSelect={() => setActiveScheduleId(s.id)}
									onDelete={() => handleDeleteSchedule(s)}
									onRename={(name) => handleRenameSchedule(s.id, name)}
								/>
							))}
						</ul>
					</>
				)}
				{!sidebarCollapsed && activeSchedule && (
					<>
						<div className="mt-6 flex items-center justify-between">
							<span className="text-sm font-medium text-gt-navy dark:text-foreground">Credit hours</span>
							<span className="text-sm text-gt-gray-matter dark:text-foreground-muted">
								{totalCredits}
							</span>
						</div>
						<h3 className="mt-4 text-sm font-semibold text-gt-navy dark:text-foreground">Classes</h3>
						<ul className="mt-2 space-y-2">
							{activeSchedule.schedule_sections?.map((ss) => (
								<li
									key={ss.id}
									className="rounded-lg border border-gt-pi-mile bg-gt-white p-2 dark:border-gt-gray-matter dark:bg-surface"
								>
									<Link
										href={`/course/${ss.section?.course_id}`}
										className="text-sm font-medium text-gt-navy hover:underline dark:text-foreground"
									>
										{ss.section?.course?.department}{' '}
										{ss.section?.course?.course_number}{' '}
										{ss.section?.course?.course_name}
									</Link>
									<p className="mt-0.5 text-xs text-gt-gray-matter dark:text-foreground-muted">
										Section {ss.section?.section_code} ·{' '}
										{ss.section?.instructor?.name ?? 'TBA'} ·{' '}
										{ss.section
											? `${formatDaysShort(ss.section.day_pattern)} ${formatTimeDisplay(ss.section.start_time)}`
											: ''}
									</p>
									<Button
										variant="ghost"
										size="sm"
										className="mt-1 h-7 text-xs text-red-600"
										onClick={() => handleRemoveSection(ss.id)}
										aria-label="Remove from schedule"
									>
										Remove
									</Button>
								</li>
							))}
						</ul>
						{!activeSchedule.schedule_sections?.length && (
							<p className="mt-2 text-sm text-gt-gray-matter dark:text-foreground-muted">
								No classes. Add from course pages.
							</p>
						)}
					</>
				)}
				<CreateScheduleDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={refetch}
				/>
			</aside>
			<main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<div className="shrink-0 border-b border-gt-pi-mile bg-gt-white px-4 py-2 dark:border-gt-gray-matter dark:bg-background">
					<BackLink href="/">Home</BackLink>
				</div>
				{schedulesLoading ? (
					<div className="p-4 text-gt-gray-matter dark:text-foreground-muted">Loading schedules…</div>
				) : scheduleLoading && activeScheduleId ? (
					<div className="p-4 text-gt-gray-matter dark:text-foreground-muted">Loading schedule…</div>
				) : !activeScheduleId || !activeSchedule ? (
					<div className="p-4 text-gt-gray-matter dark:text-foreground-muted">
						Create or select a schedule to see the calendar.
					</div>
				) : (
					<div className="min-h-0 flex-1 overflow-auto p-4">
						<CalendarGrid
							sections={
								activeSchedule.schedule_sections?.filter(
									(ss): ss is typeof ss & { section: NonNullable<typeof ss.section> } =>
										!!ss.section,
								) ?? []
							}
						/>
					</div>
				)}
			</main>
		</div>
	)
}
