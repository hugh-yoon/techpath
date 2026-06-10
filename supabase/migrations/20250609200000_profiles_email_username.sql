-- Allow email addresses in profiles.username (Supabase auth uses email)

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_format;

ALTER TABLE profiles ADD CONSTRAINT profiles_username_format
	CHECK (username ~ '^[^@]+@[^@]+\.[^@]+$');
