'use client'

import { useState } from 'react'
import { useSectionReviews } from '@/hooks'
import { SectionReviewDialog } from './section-review-dialog'
import { Button } from '@/components/ui/button'

interface SectionReviewsBlockProps {
	sectionId: string
	sectionCode: string
}

export function SectionReviewsBlock({ sectionId, sectionCode }: SectionReviewsBlockProps) {
	const { data: reviews, isLoading, refetch } = useSectionReviews(sectionId)
	const [dialogOpen, setDialogOpen] = useState(false)

	return (
		<>
			<div className="mt-2 rounded border border-gt-pi-mile/60 bg-gt-white/50 p-2 dark:border-gt-gray-matter/60 dark:bg-surface/50">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-sm font-medium">
						Reviews for Section {sectionCode}
						{!isLoading && (
							<span className="ml-1 text-gt-gray-matter dark:text-foreground-muted">
								({reviews.length})
							</span>
						)}
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setDialogOpen(true)}
						aria-label={`Add review for Section ${sectionCode}`}
					>
						Add review
					</Button>
				</div>
				{isLoading ? (
					<p className="mt-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
						Loading…
					</p>
				) : reviews.length === 0 ? (
					<p className="mt-1 text-xs text-gt-gray-matter dark:text-foreground-muted">
						No reviews yet.
					</p>
				) : (
					<ul className="mt-2 space-y-1">
						{reviews.map((r) => (
							<li
								key={r.id}
								className="rounded border border-gt-pi-mile/50 p-2 text-sm dark:border-gt-gray-matter/50"
							>
								<span>
									{r.rating}/5 rating · {r.difficulty}/5 difficulty
								</span>
								{r.comment && (
									<p className="mt-0.5 text-gt-gray-matter dark:text-foreground-muted">
										{r.comment}
									</p>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
			<SectionReviewDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				sectionId={sectionId}
				sectionCode={sectionCode}
				onSuccess={refetch}
			/>
		</>
	)
}
