CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  auth_subject text UNIQUE, role text NOT NULL DEFAULT 'member' CHECK (role IN ('leader','member')), is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(trim(name)) > 0), description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')), created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT, user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  project_role text NOT NULL DEFAULT 'member' CHECK (project_role IN ('lead','member')), joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(trim(title)) > 0), description text, status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','in_review','done','archived')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')), due_at timestamptz, weight numeric(10,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE TABLE task_assignees (task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT, user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, assigned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (task_id,user_id));
CREATE TABLE checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT, title text NOT NULL CHECK (length(trim(title)) > 0),
  is_completed boolean NOT NULL DEFAULT false, completed_by uuid REFERENCES profiles(id) ON DELETE RESTRICT, completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0, created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE TABLE task_updates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT, user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, work_summary text NOT NULL CHECK (length(trim(work_summary)) > 0), blockers text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, project_id uuid REFERENCES projects(id) ON DELETE RESTRICT, task_id uuid REFERENCES tasks(id) ON DELETE RESTRICT, action text NOT NULL CHECK (length(trim(action)) > 0), metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX projects_status_idx ON projects(status) WHERE archived_at IS NULL;
CREATE INDEX project_members_user_idx ON project_members(user_id);
CREATE INDEX tasks_project_status_idx ON tasks(project_id,status) WHERE archived_at IS NULL;
CREATE INDEX task_assignees_user_idx ON task_assignees(user_id);
CREATE INDEX checklist_task_idx ON checklist_items(task_id) WHERE archived_at IS NULL;
CREATE INDEX task_updates_task_created_idx ON task_updates(task_id,created_at DESC);
CREATE INDEX activity_project_created_idx ON activity_logs(project_id,created_at DESC);
CREATE INDEX activity_task_created_idx ON activity_logs(task_id,created_at DESC);
