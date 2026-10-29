ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE projects ADD CONSTRAINT projects_category_check CHECK (category IS NULL OR category IN ('corporate_enterprise','startup_sme','government_public','educational_community'));
