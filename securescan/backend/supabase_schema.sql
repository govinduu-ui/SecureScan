-- ==============================================================================
-- SECURESCAN – SUPABASE DATABASE SCHEMA & STORAGE SETUP
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It creates the 4 core relational tables, JSONB audit schemas, performance indexes,
-- and the Cloud Storage bucket for PDF reports.

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    _id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    password_hash TEXT,
    hashed_password TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    scan_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In case the table already existed with older columns, add missing columns:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hashed_password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS scan_count INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. SCANS TABLE
CREATE TABLE IF NOT EXISTS public.scans (
    _id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    score INT DEFAULT 0,
    grade TEXT DEFAULT 'N/A',
    category_scores JSONB DEFAULT '{}'::jsonb,
    findings_count INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    raw_headers JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINDINGS TABLE
CREATE TABLE IF NOT EXISTS public.findings (
    _id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES public.scans(_id) ON DELETE CASCADE,
    check_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    points_earned INT DEFAULT 0,
    points_possible INT DEFAULT 0,
    details TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    _id TEXT PRIMARY KEY,
    scan_id TEXT UNIQUE NOT NULL REFERENCES public.scans(_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    score INT DEFAULT 0,
    grade TEXT DEFAULT 'N/A',
    category_scores JSONB DEFAULT '{}'::jsonb,
    findings_summary JSONB DEFAULT '{}'::jsonb,
    pdf_path TEXT,
    cloud_report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON public.findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_reports_scan_id ON public.reports(scan_id);

-- 6. DISABLE ROW-LEVEL SECURITY FOR API ACCESS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- 7. CLOUD STORAGE BUCKET FOR AUDIT PDF REPORTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('securescan-reports', 'securescan-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies with idempotent drop-if-exists
DROP POLICY IF EXISTS "Public Access for SecureScan Reports" ON storage.objects;
CREATE POLICY "Public Access for SecureScan Reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'securescan-reports');

DROP POLICY IF EXISTS "Allow Uploads to SecureScan Reports" ON storage.objects;
CREATE POLICY "Allow Uploads to SecureScan Reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'securescan-reports');
