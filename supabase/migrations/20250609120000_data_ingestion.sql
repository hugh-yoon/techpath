-- Data ingestion schema
--
-- Sync cadence (see scripts/ingest/README.md):
--   MONTHLY — Banner  → courses, sections, terms, instructor names
--   DAILY   — RMP     → instructor ratings, reviews, difficulty
--
-- Requires empty or migrated sections (CRN uniqueness becomes per-term).

BEGIN;

-- ---------------------------------------------------------------------------
-- Terms (Banner academic terms)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.terms (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	semester text NOT NULL CHECK (semester IN ('Fall', 'Spring', 'Summer')),
	year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
	banner_term_code text NOT NULL UNIQUE,
	is_current boolean NOT NULL DEFAULT false,
	synced_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE (semester, year)
);

-- ---------------------------------------------------------------------------
-- Sections: term-aware + Banner metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.sections
	ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES public.terms (id),
	ADD COLUMN IF NOT EXISTS schedule_type text,
	ADD COLUMN IF NOT EXISTS campus text,
	ADD COLUMN IF NOT EXISTS contact_hours numeric,
	ADD COLUMN IF NOT EXISTS linked_section_id uuid REFERENCES public.sections (id),
	ADD COLUMN IF NOT EXISTS banner_section_id text,
	ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
	ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- CRN was globally unique; re-scope to (term_id, crn).
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_crn_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sections_term_crn
	ON public.sections (term_id, crn)
	WHERE term_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sections_crn_legacy
	ON public.sections (crn)
	WHERE term_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sections_term_id ON public.sections (term_id);
CREATE INDEX IF NOT EXISTS idx_sections_is_active ON public.sections (is_active);

-- ---------------------------------------------------------------------------
-- Instructors: RMP enrichment fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.instructors
	ADD COLUMN IF NOT EXISTS name_normalized text,
	ADD COLUMN IF NOT EXISTS rmp_professor_id text,
	ADD COLUMN IF NOT EXISTS rmp_quality numeric,
	ADD COLUMN IF NOT EXISTS rmp_difficulty numeric,
	ADD COLUMN IF NOT EXISTS rmp_would_take_again numeric,
	ADD COLUMN IF NOT EXISTS rmp_rating_count integer,
	ADD COLUMN IF NOT EXISTS rmp_department text,
	ADD COLUMN IF NOT EXISTS rmp_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_instructors_rmp_professor_id
	ON public.instructors (rmp_professor_id)
	WHERE rmp_professor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_instructors_name_normalized
	ON public.instructors (name_normalized);

-- ---------------------------------------------------------------------------
-- Instructor reviews: student + RMP in one table (source field)
-- ---------------------------------------------------------------------------
ALTER TABLE public.instructor_reviews
	ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'student'
		CHECK (source IN ('student', 'rmp')),
	ADD COLUMN IF NOT EXISTS external_review_id text,
	ADD COLUMN IF NOT EXISTS difficulty numeric,
	ADD COLUMN IF NOT EXISTS would_take_again boolean,
	ADD COLUMN IF NOT EXISTS course_context text,
	ADD COLUMN IF NOT EXISTS term_context text,
	ADD COLUMN IF NOT EXISTS scraped_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_instructor_reviews_rmp_external
	ON public.instructor_reviews (external_review_id)
	WHERE source = 'rmp' AND external_review_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Low-confidence RMP matches (best-effort auto-match audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_rmp_candidates (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	instructor_id uuid NOT NULL REFERENCES public.instructors (id) ON DELETE CASCADE,
	rmp_professor_id text NOT NULL,
	rmp_name text NOT NULL,
	rmp_department text,
	match_confidence numeric NOT NULL CHECK (
		match_confidence >= 0 AND match_confidence <= 1
	),
	status text NOT NULL DEFAULT 'auto_matched' CHECK (
		status IN ('auto_matched', 'pending', 'approved', 'rejected')
	),
	created_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE (instructor_id, rmp_professor_id)
);

-- ---------------------------------------------------------------------------
-- Sync job observability
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_jobs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	job_type text NOT NULL CHECK (
		job_type IN ('banner_full', 'rmp_daily')
	),
	status text NOT NULL DEFAULT 'running' CHECK (
		status IN ('running', 'success', 'failed')
	),
	started_at timestamptz NOT NULL DEFAULT now(),
	completed_at timestamptz,
	records_upserted integer NOT NULL DEFAULT 0,
	records_failed integer NOT NULL DEFAULT 0,
	error_summary text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_job_type_started
	ON public.sync_jobs (job_type, started_at DESC);

-- ---------------------------------------------------------------------------
-- RLS (service role bypasses; anon read where appropriate)
-- ---------------------------------------------------------------------------
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_rmp_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY terms_select ON public.terms
	FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY sync_jobs_select ON public.sync_jobs
	FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY instructor_rmp_candidates_select
	ON public.instructor_rmp_candidates
	FOR SELECT TO anon, authenticated USING (true);

COMMIT;
