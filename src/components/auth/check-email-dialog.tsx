'use client'

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

interface CheckEmailDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	email?: string | null
}

export function CheckEmailDialog({
	open,
	onOpenChange,
	email,
}: CheckEmailDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby="check-email-message">
				<DialogHeader>
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gt-tech-gold/20">
						<Mail className="h-6 w-6 text-gt-navy" aria-hidden />
					</div>
					<DialogTitle className="text-center">
						Check your inbox
					</DialogTitle>
				</DialogHeader>
				<div id="check-email-message" className="space-y-2 text-center text-sm text-gt-navy">
					<p>
						We sent a confirmation link
						{email ? (
							<>
								{' '}to <strong>{email}</strong>
							</>
						) : (
							' to your email'
						)}
						. Open it to verify your account before signing in.
					</p>
					<p className="text-gt-gray-matter">
						If you don&apos;t see the email, check your spam folder.
					</p>
				</div>
				<DialogFooter className="sm:justify-center">
					<Button type="button" onClick={() => onOpenChange(false)}>
						Got it
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
