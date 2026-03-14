-- Section reviews: one row per review for a specific section (instructor + time slot).
-- Run in Supabase SQL Editor once.
CREATE TABLE IF NOT EXISTS section_reviews (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
	rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
	difficulty int NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
	comment text
);

CREATE INDEX IF NOT EXISTS idx_section_reviews_section_id ON section_reviews(section_id);

-- Optional: enable RLS and add policy (adjust as needed for your auth)
-- ALTER TABLE section_reviews ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read/write section_reviews" ON section_reviews FOR ALL USING (true);
