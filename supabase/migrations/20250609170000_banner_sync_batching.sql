ALTER TABLE public.terms
	ADD COLUMN IF NOT EXISTS banner_subject_offset integer NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS banner_subjects_total integer,
	ADD COLUMN IF NOT EXISTS banner_sync_started_at timestamptz;

ALTER TABLE public.sections
	ADD COLUMN IF NOT EXISTS link_group_id text;

CREATE INDEX IF NOT EXISTS idx_sections_link_group
	ON public.sections (term_id, link_group_id)
	WHERE link_group_id IS NOT NULL;
