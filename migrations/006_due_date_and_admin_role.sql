-- Phase 5 · Additive migration
-- 1) tasks.due_at becomes a date-only column so Tenggat stores a calendar day, never a time.
--    Existing timestamptz values are converted in the project's local calendar (Asia/Jakarta) by
--    shifting to that zone before casting, which preserves the day the leader originally entered.
-- 2) profiles.role accepts 'admin' as a first-class role between leader and member.
-- 3) profiles gains deactivation metadata so soft-deactivation is auditable.
-- The work runs in a single transaction; if any step fails the whole migration rolls back.

BEGIN;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'due_at') <> 'date' THEN
    ALTER TABLE tasks
      ALTER COLUMN due_at TYPE date
      USING (due_at AT TIME ZONE 'Asia/Jakarta')::date;
  END IF;
END $$;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('leader', 'admin', 'member'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_by uuid REFERENCES profiles(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS profiles_active_role_idx ON profiles(role) WHERE is_active = true;

COMMIT;
