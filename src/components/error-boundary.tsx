'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) return this.props.fallback
			return (
				<div
					className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8"
					role="alert"
				>
					<h2 className="text-lg font-semibold text-gt-navy dark:text-foreground">
						Something went wrong
					</h2>
					<p className="max-w-md text-center text-sm text-gt-gray-matter dark:text-foreground-muted">
						{this.state.error.message}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => this.setState({ hasError: false, error: null })}
						>
							Try again
						</Button>
						<Button variant="outline" asChild>
							<Link href="/">Go home</Link>
						</Button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}
