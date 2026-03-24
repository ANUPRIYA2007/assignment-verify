-- ============================================================
-- PASTE THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR AND RUN IT
-- This adds all missing tables/columns needed for the Admin system
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. classes_meta table (needed for class cards on Admin Dashboard)
CREATE TABLE IF NOT EXISTS classes_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT CHECK (year IN ('1st', '2nd', '3rd', 'Final')) NOT NULL,
    section TEXT NOT NULL,
    total_boys INTEGER DEFAULT 0,
    total_girls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, section)
);

-- 2. subjects table (needed for Teacher Management)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. teacher_assignments table (needed for Teacher Management)
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year TEXT CHECK (year IN ('1st','2nd','3rd','Final')) NOT NULL,
    section TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, year, section, subject_id)
);

-- 4. Add gender column to users (needed for Boys/Girls counts)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male','female','other'));
    END IF;
END $$;

-- 5. Add missing columns to assignments
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='target_year') THEN
        ALTER TABLE assignments ADD COLUMN target_year TEXT CHECK (target_year IN ('1st','2nd','3rd','Final'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='target_section') THEN
        ALTER TABLE assignments ADD COLUMN target_section TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='subject') THEN
        ALTER TABLE assignments ADD COLUMN subject TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='assign_to') THEN
        ALTER TABLE assignments ADD COLUMN assign_to TEXT DEFAULT 'all';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='points_ontime') THEN
        ALTER TABLE assignments ADD COLUMN points_ontime INTEGER DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='points_late') THEN
        ALTER TABLE assignments ADD COLUMN points_late INTEGER DEFAULT 5;
    END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(year, section);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(year_of_study, section);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);

-- 7. Enable RLS on new tables
ALTER TABLE classes_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies (permissive — backend uses service role key)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='classes_meta' AND policyname='classes_meta_all') THEN
        CREATE POLICY "classes_meta_all" ON classes_meta FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='subjects_all') THEN
        CREATE POLICY "subjects_all" ON subjects FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teacher_assignments' AND policyname='teacher_assignments_all') THEN
        CREATE POLICY "teacher_assignments_all" ON teacher_assignments FOR ALL USING (true);
    END IF;
END $$;

-- 9. Add new tables to Realtime publication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE classes_meta;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teacher_assignments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. Replica identity for realtime DELETE payloads
ALTER TABLE classes_meta REPLICA IDENTITY FULL;
ALTER TABLE subjects REPLICA IDENTITY FULL;
ALTER TABLE teacher_assignments REPLICA IDENTITY FULL;

-- 11. Seed default subjects
INSERT INTO subjects (name, code) VALUES
    ('Mathematics', 'MATH'),
    ('Physics', 'PHY'),
    ('Chemistry', 'CHEM'),
    ('Biology', 'BIO'),
    ('Computer Science', 'CS'),
    ('English', 'ENG'),
    ('Electronics', 'ECE'),
    ('Mechanical', 'MECH')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DONE! After running this, restart your backend server.
-- ============================================================
