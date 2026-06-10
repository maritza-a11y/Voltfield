-- ================================================================
-- VoltField — EVIDAC database schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor).
-- ================================================================

-- Auto-incrementing job number sequence
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number   TEXT        UNIQUE NOT NULL
                           DEFAULT ('JOB-' || LPAD(nextval('job_number_seq')::TEXT, 3, '0')),
  client_name  TEXT        NOT NULL,
  address      TEXT        NOT NULL,
  city         TEXT        NOT NULL,
  job_type     TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'Active'
                           CHECK (status IN ('Active','Completed','On Hold','Cancelled')),
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Files attached to jobs
CREATE TABLE IF NOT EXISTS job_files (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  section      TEXT        NOT NULL
                           CHECK (section IN ('photos','invoices','contracts','permits','other','cad','videos')),
  file_name    TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  photo_lat    DOUBLE PRECISION,
  photo_lng    DOUBLE PRECISION,
  exif_data    JSONB,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT        NOT NULL DEFAULT 'Technician'
                           CHECK (role IN ('Admin','Technician')),
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','active')),
  invited_at   TIMESTAMPTZ DEFAULT NOW()
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message      TEXT        NOT NULL,
  job_id       UUID        REFERENCES jobs(id) ON DELETE SET NULL,
  job_number   TEXT,
  read         BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Storage bucket (public so file URLs work without auth tokens)
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-files', 'job-files', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Row Level Security — permissive (no auth in this version)
-- ----------------------------------------------------------------
ALTER TABLE jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_jobs"          ON jobs          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_job_files"     ON job_files     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_team_members"  ON team_members  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'job-files')
  WITH CHECK (bucket_id = 'job-files');

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_status      ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city        ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_job_files_job_id ON job_files(job_id);
CREATE INDEX IF NOT EXISTS idx_job_files_section ON job_files(section);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
