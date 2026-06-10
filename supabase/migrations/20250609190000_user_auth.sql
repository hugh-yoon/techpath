-- User profiles and per-user plan ownership

CREATE TABLE IF NOT EXISTS profiles (
	id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	username text NOT NULL,
	is_admin boolean NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3),
	CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
	ON profiles (lower(username));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
	FOR SELECT
	USING (auth.uid() = id);

CREATE POLICY profiles_insert_own ON profiles
	FOR INSERT
	WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_username ON profiles
	FOR UPDATE
	USING (auth.uid() = id)
	WITH CHECK (auth.uid() = id);

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS user_id uuid
	REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE careers ADD COLUMN IF NOT EXISTS user_id uuid
	REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS schedules_policy ON schedules;
DROP POLICY IF EXISTS careers_policy ON careers;
DROP POLICY IF EXISTS schedule_sections_policy ON schedule_sections;
DROP POLICY IF EXISTS career_schedules_policy ON career_schedules;

CREATE POLICY schedules_select ON schedules
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY schedules_insert ON schedules
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY schedules_update ON schedules
	FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY schedules_delete ON schedules
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY careers_select ON careers
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY careers_insert ON careers
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY careers_update ON careers
	FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY careers_delete ON careers
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY schedule_sections_select ON schedule_sections
	FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM schedules s
			WHERE s.id = schedule_id AND s.user_id = auth.uid()
		)
	);

CREATE POLICY schedule_sections_insert ON schedule_sections
	FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM schedules s
			WHERE s.id = schedule_id AND s.user_id = auth.uid()
		)
	);

CREATE POLICY schedule_sections_update ON schedule_sections
	FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM schedules s
			WHERE s.id = schedule_id AND s.user_id = auth.uid()
		)
	);

CREATE POLICY schedule_sections_delete ON schedule_sections
	FOR DELETE
	USING (
		EXISTS (
			SELECT 1 FROM schedules s
			WHERE s.id = schedule_id AND s.user_id = auth.uid()
		)
	);

CREATE POLICY career_schedules_select ON career_schedules
	FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM careers c
			WHERE c.id = career_id AND c.user_id = auth.uid()
		)
	);

CREATE POLICY career_schedules_insert ON career_schedules
	FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM careers c
			WHERE c.id = career_id AND c.user_id = auth.uid()
		)
	);

CREATE POLICY career_schedules_update ON career_schedules
	FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM careers c
			WHERE c.id = career_id AND c.user_id = auth.uid()
		)
	);

CREATE POLICY career_schedules_delete ON career_schedules
	FOR DELETE
	USING (
		EXISTS (
			SELECT 1 FROM careers c
			WHERE c.id = career_id AND c.user_id = auth.uid()
		)
	);

CREATE OR REPLACE FUNCTION public.is_username_available(check_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
	SELECT NOT EXISTS (
		SELECT 1 FROM profiles
		WHERE lower(username) = lower(trim(check_username))
	);
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	desired_username text;
BEGIN
	desired_username := COALESCE(
		new.raw_user_meta_data->>'username',
		split_part(new.email, '@', 1)
	);

	INSERT INTO public.profiles (id, username)
	VALUES (new.id, desired_username);

	RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
	AFTER INSERT ON auth.users
	FOR EACH ROW
	EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
