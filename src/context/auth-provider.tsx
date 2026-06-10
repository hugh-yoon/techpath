'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { normalizeEmail } from '@/lib/auth'
import { getAuthCallbackUrl } from '@/lib/site-url'

export interface UserProfile {
	id: string
	username: string
	is_admin: boolean
}

interface AuthContextValue {
	session: Session | null
	user: User | null
	profile: UserProfile | null
	isLoading: boolean
	isAuthenticated: boolean
	isAdmin: boolean
	isGuest: boolean
	signUp: (
		email: string,
		password: string,
	) => Promise<{
		error: string | null
		needsEmailConfirmation: boolean
	}>
	signIn: (
		email: string,
		password: string,
	) => Promise<{ error: string | null }>
	signOut: () => Promise<void>
	refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(
	supabase: ReturnType<typeof createClient>,
	userId: string,
): Promise<UserProfile | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, username, is_admin')
		.eq('id', userId)
		.maybeSingle()

	if (error || !data) return null
	return data as UserProfile
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const supabase = useMemo(() => createClient(), [])
	const [session, setSession] = useState<Session | null>(null)
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refreshProfile = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			setProfile(null)
			return
		}
		const nextProfile = await fetchProfile(supabase, user.id)
		setProfile(nextProfile)
	}, [supabase])

	useEffect(() => {
		let mounted = true

		const init = async () => {
			const { data: { session: initialSession } } =
				await supabase.auth.getSession()
			if (!mounted) return
			setSession(initialSession)
			if (initialSession?.user) {
				const nextProfile = await fetchProfile(
					supabase,
					initialSession.user.id,
				)
				if (mounted) setProfile(nextProfile)
			}
			if (mounted) setIsLoading(false)
		}

		void init()

		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (_event, nextSession) => {
				setSession(nextSession)
				if (nextSession?.user) {
					const nextProfile = await fetchProfile(
						supabase,
						nextSession.user.id,
					)
					setProfile(nextProfile)
				} else {
					setProfile(null)
				}
				setIsLoading(false)
			},
		)

		return () => {
			mounted = false
			subscription.unsubscribe()
		}
	}, [supabase])

	const signUp = useCallback(
		async (email: string, password: string) => {
			const normalizedEmail = normalizeEmail(email)
			const { data, error } = await supabase.auth.signUp({
				email: normalizedEmail,
				password,
				options: {
					data: { username: normalizedEmail },
					emailRedirectTo: getAuthCallbackUrl(),
				},
			})

			if (error) {
				return { error: error.message, needsEmailConfirmation: false }
			}

			return {
				error: null,
				needsEmailConfirmation: !data.session,
			}
		},
		[supabase],
	)

	const signIn = useCallback(
		async (email: string, password: string) => {
			const { error } = await supabase.auth.signInWithPassword({
				email: normalizeEmail(email),
				password,
			})
			return { error: error?.message ?? null }
		},
		[supabase],
	)

	const signOut = useCallback(async () => {
		await supabase.auth.signOut()
		setProfile(null)
		setSession(null)
	}, [supabase])

	const value = useMemo<AuthContextValue>(
		() => ({
			session,
			user: session?.user ?? null,
			profile,
			isLoading,
			isAuthenticated: !!session?.user,
			isAdmin: profile?.is_admin ?? false,
			isGuest: !session?.user,
			signUp,
			signIn,
			signOut,
			refreshProfile,
		}),
		[
			session,
			profile,
			isLoading,
			signUp,
			signIn,
			signOut,
			refreshProfile,
		],
	)

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
