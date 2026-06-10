'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Shield, User } from 'lucide-react'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AccountMenuProps {
	tone?: 'default' | 'light'
}

export function AccountMenu({ tone = 'default' }: AccountMenuProps) {
	const router = useRouter()
	const { isLoading, isAuthenticated, user, profile, isAdmin, signOut } =
		useAuth()
	const isLight = tone === 'light'

	if (isLoading) {
		return (
			<div
				className={cn(
					'h-8 w-24 rounded-lg',
					isLight ? 'bg-white/15' : 'bg-gt-navy/10',
				)}
				aria-hidden
			/>
		)
	}

	if (!isAuthenticated) {
		return (
			<div className="flex items-center gap-2">
				<Button
					asChild
					variant="outline"
					size="sm"
					className={cn(
						isLight &&
							'border-white/30 bg-transparent text-white hover:bg-white/12 hover:!text-white',
					)}
				>
					<Link href="/auth/sign-in">Sign in</Link>
				</Button>
				<Button
					asChild
					size="sm"
					className={cn(
						isLight &&
							'bg-gt-tech-gold text-gt-navy hover:bg-white/12 hover:!text-white',
					)}
				>
					<Link href="/auth/sign-up">Sign up</Link>
				</Button>
			</div>
		)
	}

	const handleSignOut = async () => {
		await signOut()
		router.push('/')
		router.refresh()
	}

	return (
		<div className="flex items-center gap-2">
			<div
				className={cn(
					'flex max-w-[12rem] items-center gap-1.5 text-sm sm:max-w-xs',
					isLight ? 'text-white/90' : 'text-gt-navy',
				)}
			>
				<User
					className={cn(
						'h-4 w-4 shrink-0',
						isLight ? 'text-white/60' : 'text-gt-gray-matter',
					)}
					aria-hidden
				/>
				<span className="truncate font-medium">
					{user?.email ?? profile?.username ?? 'Account'}
				</span>
			</div>
			{isAdmin && (
				<Button
					asChild
					variant="outline"
					size="sm"
					className={cn(
						isLight &&
							'border-white/30 bg-transparent text-white hover:bg-white/12 hover:text-white',
					)}
				>
					<Link href="/admin">
						<Shield className="mr-1.5 h-4 w-4" aria-hidden />
						Admin
					</Link>
				</Button>
			)}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={handleSignOut}
				aria-label="Sign out"
				className={cn(
					isLight &&
						'text-white/80 hover:bg-white/12 hover:text-white',
				)}
			>
				<LogOut className="mr-1.5 h-4 w-4" aria-hidden />
				Sign out
			</Button>
		</div>
	)
}
