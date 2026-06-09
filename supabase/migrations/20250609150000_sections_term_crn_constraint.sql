-- PostgREST upsert requires a full unique constraint, not a partial index.
DROP INDEX IF EXISTS uq_sections_term_crn;

ALTER TABLE public.sections
	ADD CONSTRAINT sections_term_id_crn_key UNIQUE (term_id, crn);
