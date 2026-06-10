'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ConfirmEmailContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const status = searchParams.get('status')
	const next = searchParams.get('next') ?? '/'
	const isSuccess = status === 'success'

	if (status !== 'success' && status !== 'error') {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gt-white p-6">
				<div className="w-full max-w-md rounded-2xl border-2 border-gt-navy/10 bg-gt-diploma p-6 text-center shadow-sm">
					<p className="text-gt-gray-matter">
						This confirmation link is invalid or incomplete.
					</p>
					<Button asChild className="mt-4">
						<Link href="/auth/sign-in">Go to sign in</Link>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gt-white p-6">
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="w-full max-w-md rounded-2xl border-2 border-gt-navy/10 bg-gt-diploma p-6 text-center shadow-sm"
			>
				<div
					className={
						isSuccess
							? 'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100'
							: 'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100'
					}
				>
					{isSuccess ? (
						<CheckCircle2
							className="h-8 w-8 text-green-700"
							aria-hidden
						/>
					) : (
						<XCircle className="h-8 w-8 text-red-700" aria-hidden />
					)}
				</div>

				<h1 className="text-2xl font-semibold text-gt-navy">
					{isSuccess
						? 'Email confirmed'
						: 'Confirmation failed'}
				</h1>

				<p className="mt-2 text-sm text-gt-gray-matter" role="status">
					{isSuccess
						? 'Your email address has been verified. You can now sign in and use TechPlan.'
						: 'This confirmation link is invalid or has expired. Request a new one by signing up again or contact support.'}
				</p>

				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					{isSuccess ? (
						<>
							<Button
								type="button"
								onClick={() => router.push(next)}
							>
								Continue
							</Button>
							<Button asChild variant="outline">
								<Link href="/">Back to home</Link>
							</Button>
						</>
					) : (
						<>
							<Button asChild>
								<Link href="/auth/sign-up">Create account</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/auth/sign-in">Sign in</Link>
							</Button>
						</>
					)}
				</div>
			</motion.div>
		</div>
	)
}

export default function ConfirmEmailPage() {
	return (
		<Suspense fallback={null}>
			<ConfirmEmailContent />
		</Suspense>
	)
}
