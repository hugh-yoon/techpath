'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
	id: string
	message: string
	variant: ToastVariant
}

interface ActionToastContextValue {
	notify: (message: string, variant?: ToastVariant) => void
}

const ActionToastContext = createContext<ActionToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
	success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
	error: 'border-red-200 bg-red-50 text-red-900',
	info: 'border-gt-navy/15 bg-gt-white text-gt-navy',
}

const variantIcons = {
	success: CheckCircle2,
	error: XCircle,
	info: Info,
} as const

export function ActionToastProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [toasts, setToasts] = useState<ToastItem[]>([])

	const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
		setToasts((prev) => [...prev, { id, message, variant }])

		window.setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id))
		}, 3200)
	}, [])

	const value = useMemo(() => ({ notify }), [notify])

	return (
		<ActionToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2">
				{toasts.map((toast) => {
					const Icon = variantIcons[toast.variant]
					return (
						<div
							key={toast.id}
							role="status"
							aria-live="polite"
							className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-sm ${variantStyles[toast.variant]}`}
						>
							<div className="flex items-start gap-2">
								<Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
								<p className="text-sm font-medium leading-snug">{toast.message}</p>
							</div>
						</div>
					)
				})}
			</div>
		</ActionToastContext.Provider>
	)
}

export function useActionToast() {
	const ctx = useContext(ActionToastContext)
	if (!ctx) {
		throw new Error('useActionToast must be used inside ActionToastProvider')
	}
	return ctx
}
