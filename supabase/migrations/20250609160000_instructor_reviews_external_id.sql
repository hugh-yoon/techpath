DROP INDEX IF EXISTS uq_instructor_reviews_rmp_external;

ALTER TABLE public.instructor_reviews
	ADD CONSTRAINT instructor_reviews_external_review_id_key
	UNIQUE (external_review_id);
