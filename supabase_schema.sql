-- Evalyn — Supabase Database Schema
-- Run this script in the Supabase SQL Editor to set up your database.

-- 1. Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,
    register_number TEXT UNIQUE,
    year_of_study TEXT CHECK (year_of_study IN ('1st', '2nd', '3rd', 'Final')),
    section TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('file', 'mcq')) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    total_marks INTEGER DEFAULT 100,
    mcq_duration INTEGER DEFAULT 0,
    result_publish_date TIMESTAMPTZ,
    is_visible BOOLEAN DEFAULT TRUE,
    target_year TEXT CHECK (target_year IN ('1st', '2nd', '3rd', 'Final')),
    target_section TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create classes_meta table (New)
CREATE TABLE classes_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT CHECK (year IN ('1st', '2nd', '3rd', 'Final')) NOT NULL,
    section TEXT NOT NULL,
    total_boys INTEGER DEFAULT 0,
    total_girls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, section)
);

-- ... (rest of original tables)

-- 3. Create mcq_questions table
CREATE TABLE mcq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT CHECK (correct_answer IN ('a', 'b', 'c', 'd')) NOT NULL,
    marks INTEGER DEFAULT 1,
    
    CONSTRAINT mcq_questions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- 4. Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    file_url TEXT,
    status TEXT CHECK (status IN ('pending', 'evaluated')) DEFAULT 'pending',
    marks_obtained INTEGER,
    feedback TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    evaluated_file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Create student_answers table
CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    question_id UUID NOT NULL,
    student_id UUID NOT NULL,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    
    CONSTRAINT student_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES mcq_questions(id) ON DELETE CASCADE,
    CONSTRAINT student_answers_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Create late_requests table
CREATE TABLE late_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    student_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT late_requests_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT late_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT late_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
