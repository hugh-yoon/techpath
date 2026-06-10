'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-provider'
import { signUpSchema, type SignUpFormValues } from '@/lib/validations/auth'

function SignUpForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const redirectTo = searchParams.get('redirect') ?? '/'
	const { signUp } = useAuth()
	const [submitError, setSubmitError] = useState<string | null>(null)

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const handleSubmit = form.handleSubmit(async (values) => {
		setSubmitError(null)
		const { error, needsEmailConfirmation } = await signUp(
			values.email,
			values.password,
		)
		if (error) {
			setSubmitError(error)
			return
		}

		if (needsEmailConfirmation) {
			const signInUrl = new URL('/auth/sign-in', window.location.origin)
			signInUrl.searchParams.set('checkEmail', '1')
			signInUrl.searchParams.set('email', values.email)
			signInUrl.searchParams.set('redirect', redirectTo)
			router.push(`${signInUrl.pathname}${signInUrl.search}`)
			return
		}

		router.push(redirectTo)
		router.refresh()
	})

	return (
		<AuthFormShell
			title="Create account"
			subtitle="Enter your email and password to save schedules and career plans"
			footer={
				<>
					Already have an account?{' '}
					<Link
						href={`/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
						className="font-semibold text-gt-navy underline underline-offset-2"
					>
						Sign in
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
					<p className="mt-1 text-xs text-gt-gray-matter">
						A valid email address is required to create your account.
					</p>
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
						autoComplete="new-password"
						className="mt-1"
						{...form.register('password')}
					/>
					{form.formState.errors.password && (
						<p className="mt-1 text-sm text-red-600" role="alert">
							{form.formState.errors.password.message}
						</p>
					)}
				</div>
				<div>
					<Label htmlFor="confirmPassword">Confirm password</Label>
					<PasswordInput
						id="confirmPassword"
						autoComplete="new-password"
						className="mt-1"
						{...form.register('confirmPassword')}
					/>
					{form.formState.errors.confirmPassword && (
						<p className="mt-1 text-sm text-red-600" role="alert">
							{form.formState.errors.confirmPassword.message}
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
					{form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
				</Button>
			</form>
		</AuthFormShell>
	)
}

export default function SignUpPage() {
	return (
		<Suspense fallback={null}>
			<SignUpForm />
		</Suspense>
	)
}
