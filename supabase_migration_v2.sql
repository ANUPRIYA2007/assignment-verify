-- ============================================================
-- Evalyn v2 Migration — Admin Full Control, Teacher Assignments, Subjects
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teacher-Class-Subject assignments
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

-- 3. Add gender column to users if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male','female','other'));
    END IF;
END $$;

-- 4. Add missing columns to assignments if not present
DO $$ BEGIN
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

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(year, section);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(year_of_study, section);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);

-- 6. Enable RLS on new tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Permissive policies (service-role key bypasses these)
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT USING (true);
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (true);

CREATE POLICY "teacher_assignments_read_all" ON teacher_assignments FOR SELECT USING (true);
CREATE POLICY "teacher_assignments_admin_all" ON teacher_assignments FOR ALL USING (true);

-- 8. Add new tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_assignments;

-- 9. Replica identity for realtime DELETE payloads
ALTER TABLE subjects REPLICA IDENTITY FULL;
ALTER TABLE teacher_assignments REPLICA IDENTITY FULL;

-- 10. Seed some default subjects
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

-- Done! Now restart the server.
