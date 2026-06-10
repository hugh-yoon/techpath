'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { CheckEmailDialog } from '@/components/auth/check-email-dialog'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-provider'
import { signInSchema, type SignInFormValues } from '@/lib/validations/auth'

function SignInForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const redirectTo = searchParams.get('redirect') ?? '/'
	const checkEmail = searchParams.get('checkEmail') === '1'
	const pendingEmail = searchParams.get('email')
	const { signIn } = useAuth()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [checkEmailOpen, setCheckEmailOpen] = useState(checkEmail)

	const form = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: pendingEmail ?? '',
			password: '',
		},
	})

	useEffect(() => {
		setCheckEmailOpen(checkEmail)
	}, [checkEmail])

	useEffect(() => {
		if (pendingEmail) {
			form.setValue('email', pendingEmail)
		}
	}, [pendingEmail, form])

	const handleCheckEmailOpenChange = (open: boolean) => {
		setCheckEmailOpen(open)
		if (!open && checkEmail) {
			const nextUrl = new URL('/auth/sign-in', window.location.origin)
			nextUrl.searchParams.set('redirect', redirectTo)
			if (pendingEmail) {
				nextUrl.searchParams.set('email', pendingEmail)
			}
			router.replace(`${nextUrl.pathname}${nextUrl.search}`)
		}
	}

	const handleSubmit = form.handleSubmit(async (values) => {
		setSubmitError(null)
		const { error } = await signIn(values.email, values.password)
		if (error) {
			setSubmitError(error)
			return
		}
		router.push(redirectTo)
		router.refresh()
	})

	return (
		<>
			<AuthFormShell
				title="Sign in"
				subtitle="Enter your email and password to access saved plans"
				footer={
					<>
						Don&apos;t have an account?{' '}
						<Link
							href={`/auth/sign-up?redirect=${encodeURIComponent(redirectTo)}`}
							className="font-semibold text-gt-navy underline underline-offset-2"
						>
							Create one
						</Link>
					</>
				}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							inputMode="email"
							className="mt-1"
							{...form.register('email')}
						/>
						{form.formState.errors.email && (
							<p className="mt-1 text-sm text-red-600" role="alert">
								{form.formState.errors.email.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor="password">Password</Label>
						<PasswordInput
							id="password"
							autoComplete="current-password"
							className="mt-1"
							{...form.register('password')}
						/>
						{form.formState.errors.password && (
							<p className="mt-1 text-sm text-red-600" role="alert">
								{form.formState.errors.password.message}
							</p>
						)}
					</div>
					{submitError && (
						<p className="text-sm text-red-600" role="alert">
							{submitError}
						</p>
					)}
					<Button
						type="submit"
						className="w-full"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
					</Button>
				</form>
			</AuthFormShell>

			<CheckEmailDialog
				open={checkEmailOpen}
				onOpenChange={handleCheckEmailOpenChange}
				email={pendingEmail}
			/>
		</>
	)
}

export default function SignInPage() {
	return (
		<Suspense fallback={null}>
			<SignInForm />
		</Suspense>
	)
}
