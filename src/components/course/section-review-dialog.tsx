'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSectionReview } from '@/hooks'
import { useState } from 'react'

interface SectionReviewDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	sectionId: string
	sectionCode: string
	onSuccess?: () => void
}

export function SectionReviewDialog({
	open,
	onOpenChange,
	sectionId,
	sectionCode,
	onSuccess,
}: SectionReviewDialogProps) {
	const { create, isLoading: submitting } = useCreateSectionReview(sectionId)
	const [rating, setRating] = useState(3)
	const [difficulty, setDifficulty] = useState(3)
	const [comment, setComment] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const ok = await create(rating, difficulty, comment || null)
		if (ok) {
			setRating(3)
			setDifficulty(3)
			setComment('')
			onOpenChange(false)
			onSuccess?.()
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add review for Section {sectionCode}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid grid-cols-2 gap-2">
						<div>
							<Label htmlFor="section-review-rating">Rating (1–5)</Label>
							<Input
								id="section-review-rating"
								type="number"
								min={1}
								max={5}
								value={rating}
								onChange={(e) => setRating(parseInt(e.target.value, 10) || 3)}
							/>
						</div>
						<div>
							<Label htmlFor="section-review-difficulty">Difficulty (1–5)</Label>
							<Input
								id="section-review-difficulty"
								type="number"
								min={1}
								max={5}
								value={difficulty}
								onChange={(e) =>
									setDifficulty(parseInt(e.target.value, 10) || 3)
								}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="section-review-comment">Comment</Label>
						<Textarea
							id="section-review-comment"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							Submit review
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
