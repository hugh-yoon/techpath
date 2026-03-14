'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSchedules, useSchedule } from '@/hooks'
import { useScheduleStore } from '@/stores/schedule-store'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarGrid } from '@/components/schedule/calendar-grid'
import { CreateScheduleDialog } from '@/components/schedule/create-schedule-dialog'
import { Skeleton } from '@/components/ui/skeleton'
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
	const { data: activeSchedule, isLoading: scheduleLoading, refetch: refetchActiveSchedule } =
		useSchedule(activeScheduleId ?? null)
	const [createOpen, setCreateOpen] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [contentFaded, setContentFaded] = useState(false)
	const [contentFadeIn, setContentFadeIn] = useState(false)

	useEffect(() => {
		if (!contentFaded) return
		const t = setTimeout(() => {
			setSidebarCollapsed(true)
			setContentFaded(false)
		}, 150)
		return () => clearTimeout(t)
	}, [contentFaded])

	useEffect(() => {
		if (!contentFadeIn) return
		const t = setTimeout(() => setContentFadeIn(false), 300)
		return () => clearTimeout(t)
	}, [contentFadeIn])

	const handleCollapseClick = useCallback(() => {
		if (sidebarCollapsed) {
			setSidebarCollapsed(false)
			setContentFadeIn(true)
		} else {
			setContentFaded(true)
		}
	}, [sidebarCollapsed])

	const showContent = !sidebarCollapsed || contentFaded
	const contentOpacity = contentFaded ? 0 : contentFadeIn ? 0 : 1

	const handleRemoveSection = useCallback(
		async (scheduleSectionId: string) => {
			if (!confirm('Remove this class from your schedule?')) return
			const { error } = await supabase
				.from('schedule_sections')
				.delete()
				.eq('id', scheduleSectionId)
			if (error) {
				console.error('Failed to remove section:', error)
				return
			}
			await refetchActiveSchedule()
			await refetch()
		},
		[refetch, refetchActiveSchedule],
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
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
			<div className="flex shrink-0 items-center justify-between border-b border-gt-navy/10 bg-gradient-to-r from-gt-navy to-gt-navy/90 px-4 py-3">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 rounded-lg bg-gt-tech-gold px-3 py-1.5 text-sm font-medium text-white hover:bg-gt-tech-medium-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gt-tech-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gt-navy"
					aria-label="Home"
				>
					<svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7-1a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-7-1h12" />
					</svg>
					Home
				</Link>
				<h1 className="text-lg font-bold text-gt-tech-gold">Schedule Builder</h1>
				<div className="w-14" aria-hidden />
			</div>
			<div className="flex min-h-0 flex-1 overflow-hidden">
			<aside
				className={cn(
					'flex h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-gt-pi-mile bg-gt-diploma transition-[width] duration-300 ease-in-out dark:border-gt-gray-matter dark:bg-surface',
					sidebarCollapsed ? 'w-24 p-2' : 'w-72 p-4',
				)}
			>
				<div className="flex shrink-0 items-center justify-end">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0 hover:!bg-gt-tech-gold/20 hover:!text-gt-navy"
						onClick={handleCollapseClick}
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
				{showContent && (
					<h2
						className="mt-2 shrink-0 min-w-0 truncate text-sm font-semibold uppercase tracking-wide text-gt-navy transition-opacity duration-150"
						style={{ opacity: contentOpacity }}
					>
						Schedules
					</h2>
				)}
				{showContent && (
					<div
						className="min-w-0 flex-1 overflow-hidden transition-opacity duration-150"
						style={{ opacity: contentOpacity }}
					>
						<Button
							size="sm"
							className="mt-2 w-full bg-gt-tech-gold text-gt-navy hover:opacity-90"
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
						{activeSchedule && (
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
					</div>
				)}
				<CreateScheduleDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={refetch}
				/>
			</aside>
			<main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				{schedulesLoading ? (
					<div className="p-4" aria-hidden>
						<div className="rounded-lg border border-gt-pi-mile dark:border-gt-gray-matter overflow-hidden">
							<div className="flex border-b border-gt-pi-mile dark:border-gt-gray-matter">
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={i} className="h-10 flex-1 min-w-[60px]" />
								))}
							</div>
							<div className="flex">
								<div className="w-14 shrink-0 space-y-1 border-r border-gt-pi-mile p-1 dark:border-gt-gray-matter">
									{Array.from({ length: 8 }).map((_, i) => (
										<Skeleton key={i} className="h-4 w-10" />
									))}
								</div>
								<div className="flex-1 grid grid-cols-5 gap-px bg-gt-pi-mile dark:bg-gt-gray-matter">
									{Array.from({ length: 40 }).map((_, i) => (
										<Skeleton key={i} className="h-12 bg-gt-diploma dark:bg-surface" />
									))}
								</div>
							</div>
						</div>
					</div>
				) : scheduleLoading && activeScheduleId ? (
					<div className="p-4" aria-hidden>
						<div className="rounded-lg border border-gt-pi-mile dark:border-gt-gray-matter overflow-hidden">
							<div className="flex border-b border-gt-pi-mile dark:border-gt-gray-matter">
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={i} className="h-10 flex-1 min-w-[60px]" />
								))}
							</div>
							<div className="flex">
								<div className="w-14 shrink-0 space-y-1 border-r border-gt-pi-mile p-1 dark:border-gt-gray-matter">
									{Array.from({ length: 8 }).map((_, i) => (
										<Skeleton key={i} className="h-4 w-10" />
									))}
								</div>
								<div className="flex-1 grid grid-cols-5 gap-px bg-gt-pi-mile dark:bg-gt-gray-matter">
									{Array.from({ length: 40 }).map((_, i) => (
										<Skeleton key={i} className="h-12 bg-gt-diploma dark:bg-surface" />
									))}
								</div>
							</div>
						</div>
					</div>
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
		</div>
	)
}
