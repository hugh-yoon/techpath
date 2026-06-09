CREATE POLICY instructor_rmp_candidates_update ON public.instructor_rmp_candidates
	FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY instructor_rmp_candidates_insert ON public.instructor_rmp_candidates
	FOR INSERT TO anon, authenticated WITH CHECK (true);
