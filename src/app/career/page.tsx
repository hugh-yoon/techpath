'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
	DndContext,
	DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
	closestCenter,
	useDroppable,
	useDraggable,
} from '@dnd-kit/core'
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCareers, useCareer, useSchedules } from '@/hooks'
import { usePrerequisiteMap } from '@/hooks/use-prerequisite-map'
import { supabase } from '@/lib/supabaseClient'
import { useCareerStore } from '@/stores/career-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getPrerequisiteViolations, getEligibleSemesterOrders } from '@/utils/prerequisite-validation'
import type { CareerWithSchedules, Career } from '@/types'
import { cn } from '@/lib/utils'
import { useActionToast } from '@/components/ui/action-toast'

function CareerSidebarItem({
	career,
	isActive,
	onSelect,
	onDelete,
	onRename,
}: {
	career: Career
	isActive: boolean
	onSelect: () => void
	onDelete: () => void
	onRename: (name: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [editName, setEditName] = useState(career.name)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (editing) {
			setEditName(career.name)
			inputRef.current?.focus()
			inputRef.current?.select()
		}
	}, [editing, career.name])

	const handleSubmit = () => {
		const trimmed = editName.trim()
		if (trimmed && trimmed !== career.name) onRename(trimmed)
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
					{career.name}
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
				aria-label={`Delete ${career.name}`}
			>
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</Button>
		</li>
	)
}

function AddScheduleToCareerButton({
	careerId,
	onAdded,
}: {
	careerId: string
	onAdded: () => void
}) {
	const { data: schedules } = useSchedules()
	const [open, setOpen] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const handleAdd = async () => {
		if (!selectedId) return
		const { data: existing } = await supabase
			.from('career_schedules')
			.select('semester_order')
			.eq('career_id', careerId)
			.order('semester_order', { ascending: false })
			.limit(1)
		const nextOrder = existing?.[0]?.semester_order != null ? existing[0].semester_order + 1 : 0
		await supabase.from('career_schedules').insert({
			career_id: careerId,
			schedule_id: selectedId,
			semester_order: nextOrder,
		})
		onAdded()
		setOpen(false)
		setSelectedId(null)
	}

	return (
		<>
			<Button size="sm" className="bg-gt-tech-gold text-gt-navy hover:opacity-90" onClick={() => setOpen(true)}>
				Add schedule to career
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent aria-describedby={undefined}>
					<DialogHeader>
						<DialogTitle>Add schedule</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-gt-gray-matter dark:text-foreground-muted">
						Select a schedule to add to this career plan.
					</p>
					<ul className="mt-2 max-h-48 space-y-1 overflow-auto">
						{schedules.map((s) => (
							<li key={s.id}>
								<button
									type="button"
									onClick={() => setSelectedId(s.id)}
									className={cn(
										'w-full rounded px-3 py-2 text-left text-sm',
										selectedId === s.id
											? 'bg-gt-tech-gold/30 text-gt-navy dark:bg-gt-tech-gold/40 dark:text-gt-navy'
											: 'text-gt-navy hover:bg-gt-pi-mile dark:text-foreground dark:hover:bg-gt-gray-matter',
									)}
								>
									{s.name} – {s.semester} {s.year}
								</button>
							</li>
						))}
					</ul>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAdd} disabled={!selectedId}>
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

function CreateCareerDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean
	onOpenChange: (o: boolean) => void
	onCreated: () => void
}) {
	const [name, setName] = useState('')
	const [loading, setLoading] = useState(false)
	const setActiveCareerId = useCareerStore((s) => s.setActiveCareerId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return
		setLoading(true)
		const { data, error } = await supabase
			.from('careers')
			.insert({ name: name.trim() })
			.select('id')
			.single()
		setLoading(false)
		if (error) return
		if (data) setActiveCareerId(data.id)
		onCreated()
		onOpenChange(false)
		setName('')
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Create career plan</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div>
						<label htmlFor="career-name" className="text-sm font-medium">
							Name
						</label>
						<Input
							id="career-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Computer Science"
							className="mt-1"
						/>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function SortableSemesterCard({
	cs,
	violations: _violations,
	children,
}: {
	cs: { id: string; schedule_id: string; semester_order: number; schedule: ScheduleWithSections | null }
	violations: Set<string>
	children: React.ReactNode
}) {
	const schedule = cs.schedule
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: cs.id,
		data: { type: 'semester', semester_order: cs.semester_order },
	})
	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: cs.schedule_id,
		data: { type: 'schedule', schedule_id: cs.schedule_id, semester_order: cs.semester_order },
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const ref = (node: HTMLDivElement | null) => {
		setNodeRef(node)
		setDropRef(node)
	}

	return (
		<div
			ref={ref}
			style={style}
			className={cn(
				'rounded-lg border bg-gt-white p-4 dark:bg-surface',
				isOver ? 'border-gt-bold-blue dark:border-gt-bold-blue' : 'border-gt-pi-mile dark:border-gt-gray-matter',
				isDragging && 'opacity-50',
			)}
		>
			<div className="flex items-center gap-2">
				<button
					type="button"
					className="cursor-grab touch-none rounded p-1 hover:bg-gt-pi-mile dark:hover:bg-gt-gray-matter"
					aria-label="Drag to reorder semester"
					{...attributes}
					{...listeners}
				>
					<svg className="h-4 w-4 text-gt-gray-matter dark:text-foreground-muted" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
						<path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
					</svg>
				</button>
				<span className="font-semibold">
					{schedule?.name ?? 'Schedule'} – {schedule?.semester} {schedule?.year}
				</span>
			</div>
			<div className="mt-2 min-h-[60px]">
				{children}
			</div>
		</div>
	)
}

// ScheduleWithSections type for the card
interface ScheduleWithSections {
	name?: string
	semester?: string
	year?: number
	schedule_sections?: Array<{
		id: string
		section_id: string
		section: { id: string; course_id: string; section_code?: string; course?: { department?: string; course_number?: number; course_name?: string } }
	}>
}

export default function CareerPage() {
	const { data: careers, isLoading: careersLoading, refetch: refetchCareers } = useCareers()
	const activeCareerId = useCareerStore((s) => s.activeCareerId)
	const setActiveCareerId = useCareerStore((s) => s.setActiveCareerId)
	const { data: career, refetch: refetchCareer } = useCareer(activeCareerId)
	const prereqMap = usePrerequisiteMap()
	const [createOpen, setCreateOpen] = useState(false)
	const [conflictModal, setConflictModal] = useState<{
		scheduleSectionId: string
		sectionLabel: string
		targetScheduleId: string
		eligibleOrders: number[]
		careerSchedules: CareerWithSchedules['career_schedules']
	} | null>(null)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [draftCareerSchedules, setDraftCareerSchedules] = useState<
		CareerWithSchedules['career_schedules']
	>([])
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const { notify } = useActionToast()

	const handleDeleteCareer = useCallback(
		async (c: Career) => {
			if (!confirm(`Delete career plan "${c.name}"? Schedules will not be deleted.`)) return
			await supabase.from('careers').delete().eq('id', c.id)
			if (activeCareerId === c.id) {
				const rest = careers.filter((x) => x.id !== c.id)
				setActiveCareerId(rest[0]?.id ?? null)
			}
			await refetchCareers()
		},
		[activeCareerId, careers, setActiveCareerId, refetchCareers],
	)

	const handleRenameCareer = useCallback(
		async (careerId: string, name: string) => {
			await supabase.from('careers').update({ name }).eq('id', careerId)
			await refetchCareers()
			if (activeCareerId === careerId) await refetchCareer()
		},
		[activeCareerId, refetchCareers, refetchCareer],
	)

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	)

	const careerSchedulesSorted = useMemo(() => {
		const list = career?.career_schedules ?? []
		return [...list].sort((a, b) => a.semester_order - b.semester_order)
	}, [career?.career_schedules])

	useEffect(() => {
		setDraftCareerSchedules(careerSchedulesSorted)
		setHasUnsavedChanges(false)
	}, [careerSchedulesSorted, activeCareerId])

	const draftCareerLike = useMemo(() => {
		if (!career) return null
		return {
			...career,
			career_schedules: draftCareerSchedules,
		} as CareerWithSchedules
	}, [career, draftCareerSchedules])

	const violations = getPrerequisiteViolations(draftCareerLike, prereqMap)

	const moveSectionInDraft = useCallback(
		(scheduleSectionId: string, targetScheduleId: string) => {
			setDraftCareerSchedules((prev) => {
				let sourceScheduleId: string | null = null
				let movedSection: ScheduleWithSections['schedule_sections'][number] | null = null

				const withoutSection = prev.map((cs) => {
					const schedule = (cs.schedule as ScheduleWithSections | null) ?? null
					const sections = schedule?.schedule_sections ?? []
					const nextSections = sections.filter((ss) => {
						const isMatch = ss.id === scheduleSectionId
						if (isMatch) {
							sourceScheduleId = cs.schedule_id
							movedSection = ss
						}
						return !isMatch
					})
					return {
						...cs,
						schedule: schedule
							? {
									...schedule,
									schedule_sections: nextSections,
								}
							: schedule,
					}
				})

				if (!movedSection || !sourceScheduleId || sourceScheduleId === targetScheduleId) {
					return prev
				}

				setHasUnsavedChanges(true)
				return withoutSection.map((cs) => {
					if (cs.schedule_id !== targetScheduleId) return cs
					const schedule = (cs.schedule as ScheduleWithSections | null) ?? null
					const sections = schedule?.schedule_sections ?? []
					return {
						...cs,
						schedule: schedule
							? {
									...schedule,
									schedule_sections: [...sections, movedSection!],
								}
							: schedule,
					}
				})
			})
		},
		[],
	)

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			if (!over) return
			const activeData = active.data.current
			const overData = over.data.current
			if (!activeData || !overData) return

			if (activeData.type === 'semester' && overData.type === 'semester') {
				const activeId = active.id as string
				const overId = over.id as string
				if (activeId === overId) return
				const oldIndex = draftCareerSchedules.findIndex((cs) => cs.id === activeId)
				const newIndex = draftCareerSchedules.findIndex((cs) => cs.id === overId)
				if (oldIndex < 0 || newIndex < 0) return
				const reordered = arrayMove(draftCareerSchedules, oldIndex, newIndex).map((cs, i) => ({
					...cs,
					semester_order: i,
				}))
				setDraftCareerSchedules(reordered)
				setHasUnsavedChanges(true)
				return
			}

			if (activeData.type === 'section') {
				const scheduleSectionId = activeData.schedule_section_id as string
				const targetScheduleId =
					overData.type === 'schedule'
						? (overData.schedule_id as string)
						: overData.type === 'section'
							? (overData.schedule_id as string)
							: overData.type === 'semester'
								? (draftCareerSchedules.find((cs) => cs.id === (over.id as string))
										?.schedule_id ?? null)
							: null
				if (!targetScheduleId) return

				const courseId = activeData.course_id as string
				const prereqs = prereqMap.get(courseId) ?? []
				const eligible = getEligibleSemesterOrders(draftCareerLike, courseId, prereqs)
				const targetCs = draftCareerSchedules.find(
					(cs) => cs.schedule_id === targetScheduleId,
				)
				const targetOrder = targetCs?.semester_order ?? -1
				if (!eligible.includes(targetOrder)) {
					setConflictModal({
						scheduleSectionId,
						sectionLabel: activeData.sectionLabel as string,
						targetScheduleId,
						eligibleOrders: eligible,
						careerSchedules: draftCareerSchedules,
					})
					return
				}
				moveSectionInDraft(scheduleSectionId, targetScheduleId)
			}
		},
		[draftCareerLike, draftCareerSchedules, moveSectionInDraft, prereqMap],
	)

	const handleSaveChanges = useCallback(async () => {
		if (!career || !hasUnsavedChanges) return

		const originalOrderById = new Map(careerSchedulesSorted.map((cs) => [cs.id, cs.semester_order]))
		const originalScheduleBySectionId = new Map<string, string>()
		for (const cs of careerSchedulesSorted) {
			const schedule = cs.schedule as ScheduleWithSections | null
			for (const ss of schedule?.schedule_sections ?? []) {
				originalScheduleBySectionId.set(ss.id, cs.schedule_id)
			}
		}

		for (const cs of draftCareerSchedules) {
			const originalOrder = originalOrderById.get(cs.id)
			if (originalOrder !== cs.semester_order) {
				const { error } = await supabase
					.from('career_schedules')
					.update({ semester_order: cs.semester_order })
					.eq('id', cs.id)
				if (error) {
					notify('Failed to save semester order', 'error')
					return
				}
			}
		}

		for (const cs of draftCareerSchedules) {
			const schedule = cs.schedule as ScheduleWithSections | null
			for (const ss of schedule?.schedule_sections ?? []) {
				const originalScheduleId = originalScheduleBySectionId.get(ss.id)
				if (originalScheduleId && originalScheduleId !== cs.schedule_id) {
					const { error } = await supabase
						.from('schedule_sections')
						.update({ schedule_id: cs.schedule_id })
						.eq('id', ss.id)
					if (error) {
						notify('Failed to save class moves', 'error')
						return
					}
				}
			}
		}

		await refetchCareer()
		setHasUnsavedChanges(false)
		notify('Career planner changes saved')
	}, [
		career,
		careerSchedulesSorted,
		draftCareerSchedules,
		hasUnsavedChanges,
		notify,
		refetchCareer,
	])

	useEffect(() => {
		if (careers.length > 0 && !activeCareerId) setActiveCareerId(careers[0].id)
	}, [careers, activeCareerId, setActiveCareerId])

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

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col">
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
				<h1 className="text-lg font-bold text-gt-tech-gold">Career Planner</h1>
				<div className="w-14" aria-hidden />
			</div>
			<div className="flex min-h-0 flex-1 overflow-hidden">
			<aside
				className={cn(
					'flex h-full flex-col shrink-0 overflow-hidden border-r border-gt-pi-mile bg-gt-diploma transition-[width] duration-300 ease-in-out dark:border-gt-gray-matter dark:bg-surface',
					sidebarCollapsed ? 'w-24 p-2' : 'w-64 p-4',
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
						className="mt-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-gt-navy transition-opacity duration-150 min-w-0 truncate"
						style={{ opacity: contentOpacity }}
					>
						Career plans
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
							Create career plan
						</Button>
						<ul className="mt-3 space-y-1">
							{careers.map((c) => (
								<CareerSidebarItem
									key={c.id}
									career={c}
									isActive={activeCareerId === c.id}
									onSelect={() => setActiveCareerId(c.id)}
									onDelete={() => handleDeleteCareer(c)}
									onRename={(name) => handleRenameCareer(c.id, name)}
								/>
							))}
						</ul>
					</div>
				)}
				<CreateCareerDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={refetchCareers}
				/>
			</aside>
			<main className="min-w-0 flex-1 flex flex-col overflow-auto">
				<div className="flex-1 p-6">
				{careersLoading ? (
					<div className="space-y-4" aria-hidden>
						<Skeleton className="h-8 w-48" />
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-24 w-full rounded-xl" />
							))}
						</div>
					</div>
				) : !activeCareerId || !career ? (
					<p className="text-gt-gray-matter dark:text-foreground-muted">Select or create a career plan.</p>
				) : (
					<>
						<div className="flex items-center justify-between flex-wrap gap-2">
							<h1 className="text-xl font-semibold">{career.name}</h1>
							<Link
								href="/schedule"
								className="text-sm text-gt-gray-matter hover:underline dark:text-foreground-muted"
							>
								Open schedule builder
							</Link>
						</div>
						<div className="mt-2 flex items-center justify-between">
							<AddScheduleToCareerButton
								careerId={career.id}
								onAdded={refetchCareer}
							/>
							{hasUnsavedChanges ? (
								<Button
									size="sm"
									className="bg-gt-navy text-gt-white hover:opacity-90"
									onClick={handleSaveChanges}
								>
									Save
								</Button>
							) : (
								<div />
							)}
						</div>
						{careerSchedulesSorted.length === 0 && (
							<p className="mt-4 text-gt-gray-matter dark:text-foreground-muted">
								Add schedules from your schedule builder to this career.
							</p>
						)}
						{violations.size > 0 && (
							<div
								className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
								role="alert"
							>
								<strong>Prerequisite warning:</strong> Some courses are scheduled
								before their prerequisites. Highlighted in red below.
							</div>
						)}
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={careerSchedulesSorted.map((cs) => cs.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="mt-6 space-y-4">
									{draftCareerSchedules.map((cs) => {
										const schedule = cs.schedule as ScheduleWithSections
										const sections = schedule?.schedule_sections ?? []
										return (
											<SortableSemesterCard
												key={cs.id}
												cs={cs as { id: string; schedule_id: string; semester_order: number; schedule: ScheduleWithSections | null }}
												violations={violations}
											>
												{sections.map((ss) => {
													const section = ss.section
													const course = section?.course
													const label = course
														? `${course.department} ${course.course_number} ${section?.section_code ?? ''}`
														: section?.id ?? ss.section_id ?? ''
													const isViolation = section?.course_id
														? violations.has(section.course_id)
														: false
													return (
														<DraggableSection
															key={ss.id}
															scheduleSectionId={ss.id}
															sectionId={section?.id ?? ''}
															courseId={section?.course_id ?? ''}
															label={label}
															isViolation={isViolation}
															scheduleId={cs.schedule_id}
														/>
													)
												})}
											</SortableSemesterCard>
										)
									})}
								</div>
							</SortableContext>
						</DndContext>
					</>
				)}
				</div>
			</main>
			{conflictModal && (
				<ConflictModal
					{...conflictModal}
					onClose={() => setConflictModal(null)}
					onMove={(scheduleId) => {
						const { scheduleSectionId: ssId } = conflictModal
						moveSectionInDraft(ssId, scheduleId)
						setConflictModal(null)
					}}
				/>
			)}
			</div>
		</div>
	)
}

function DraggableSection({
	scheduleSectionId,
	sectionId,
	courseId,
	label,
	isViolation,
	scheduleId,
}: {
	scheduleSectionId: string
	sectionId: string
	courseId: string
	label: string
	isViolation: boolean
	scheduleId: string
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: `section-${scheduleSectionId}`,
		data: {
			type: 'section',
			section_id: sectionId,
			schedule_section_id: scheduleSectionId,
			course_id: courseId,
			schedule_id: scheduleId,
			sectionLabel: label,
		},
	})
	const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'mb-2 flex items-center gap-2 rounded border px-2 py-1.5 text-sm',
				isViolation
					? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
					: 'border-gt-pi-mile dark:border-gt-gray-matter',
				isDragging && 'opacity-50',
			)}
		>
			<span
				className="cursor-grab touch-none"
				aria-label={`Drag ${label}`}
				{...attributes}
				{...listeners}
			>
				⋮⋮
			</span>
			<Link
				href={`/course/${courseId}`}
				className="flex-1 truncate hover:underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				{label}
			</Link>
		</div>
	)
}

function ConflictModal({
	sectionLabel,
	eligibleOrders,
	careerSchedules,
	onClose,
	onMove,
}: {
	scheduleSectionId: string
	sectionLabel: string
	targetScheduleId: string
	eligibleOrders: number[]
	careerSchedules: CareerWithSchedules['career_schedules']
	onClose: () => void
	onMove: (scheduleId: string) => void
}) {
	const eligibleSchedules = (careerSchedules ?? [])
		.filter((cs) => eligibleOrders.includes(cs.semester_order))
		.sort((a, b) => a.semester_order - b.semester_order)

	return (
		<Dialog open onOpenChange={() => onClose()}>
			<DialogContent aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Prerequisite conflict</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-gt-gray-matter dark:text-foreground-muted">
					<strong>{sectionLabel}</strong> cannot be placed in the selected semester
					because prerequisites are not satisfied.
				</p>
				{eligibleSchedules.length > 0 ? (
					<>
						<p className="mt-2 text-sm">Move to an eligible semester instead?</p>
						<ul className="mt-2 space-y-1">
							{eligibleSchedules.map((cs) => {
								const s = cs.schedule as ScheduleWithSections
								return (
									<li key={cs.id}>
										<Button
											variant="outline"
											size="sm"
											onClick={() => onMove(cs.schedule_id)}
										>
											{s?.name} – {s?.semester} {s?.year}
										</Button>
									</li>
								)
							})}
						</ul>
					</>
				) : (
					<p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
						No eligible schedules available. Add a later semester to your career plan.
					</p>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

