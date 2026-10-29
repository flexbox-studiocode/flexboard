ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS checklist_assignee_idx ON checklist_items(assignee_id) WHERE archived_at IS NULL;
