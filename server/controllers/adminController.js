const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const normalizeText = (value) => (value || '').toString().trim();

const findAssignmentConflicts = async ({ year, section, subject_id, excludeId = null }) => {
    let query = supabase
        .from('teacher_assignments')
        .select('*')
        .eq('year', year)
        .eq('section', section);

    if (subject_id) {
        query = query.eq('subject_id', subject_id);
    } else {
        query = query.is('subject_id', null);
    }

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

// ─── DASHBOARD STATS ─────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        console.log('📊 Fetching dashboard stats...');
        
        // Fetch all data with individual error handling
        const usersResult = await supabase.from('users').select('id, role, gender, year_of_study, section');
        const assignmentsResult = await supabase.from('assignments').select('id, type, deadline');
        const submissionsResult = await supabase.from('submissions').select('id, status, is_late, marks_obtained');
        const classesResult = await supabase.from('classes_meta').select('*');
        const subjectsResult = await supabase.from('subjects').select('id');
        const taResult = await supabase.from('teacher_assignments').select('id');
        
        const users = usersResult.data || [];
        const assignments = assignmentsResult.data || [];
        const submissions = submissionsResult.data || [];
        const classes = classesResult.data || [];
        const subjects = subjectsResult.data || [];
        const teacherAssignments = taResult.data || [];
        
        const stu = users.filter(u => u.role === 'student');
        const teachers = users.filter(u => u.role === 'teacher');
        const admins = users.filter(u => u.role === 'admin');
        
        const stats = {
            total_users: users.length,
            students: stu.length,
            teachers: teachers.length,
            admins: admins.length,
            total_assignments: assignments.length,
            file_assignments: assignments.filter(a => a.type === 'file').length,
            mcq_assignments: assignments.filter(a => a.type === 'mcq').length,
            active_assignments: assignments.filter(a => new Date(a.deadline) > new Date()).length,
            total_submissions: submissions.length,
            pending_submissions: submissions.filter(s => s.status === 'pending').length,
            evaluated_submissions: submissions.filter(s => s.status === 'evaluated').length,
            late_submissions: submissions.filter(s => s.is_late).length,
            total_classes: classes.length,
            total_subjects: subjects.length,
            total_teacher_assignments: teacherAssignments.length,
            boys: stu.filter(s => s.gender === 'male').length,
            girls: stu.filter(s => s.gender === 'female').length
        };
        
        console.log('✅ Stats fetched successfully:', stats);
        res.json({ stats });
    } catch (err) {
        console.error('❌ Get stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const { role, year, section } = req.query;
        let query = supabase.from('users')
            .select('id, email, full_name, role, register_number, year_of_study, section, gender, created_at')
            .order('created_at', { ascending: false });
        if (role) query = query.eq('role', role);
        if (year) query = query.eq('year_of_study', year);
        if (section) query = query.eq('section', section);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ users: data || [] });
    } catch (err) { console.error('Get users error:', err); res.status(500).json({ error: 'Failed to fetch users.' }); }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, full_name, role, register_number, year_of_study, section, gender } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }

        const userEmail = normalizeText(email).toLowerCase();
        const userName = normalizeText(full_name);
        if (!userEmail || !userName) {
            return res.status(400).json({ error: 'Valid email and full name are required.' });
        }

        const validRoles = ['student', 'teacher', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'student';

        if (userRole === 'student' && (!year_of_study || !section)) {
            return res.status(400).json({ error: 'Student must have year and section.' });
        }

        const { data: existing, error: existingErr } = await supabase
            .from('users')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

        if (existingErr) throw existingErr;
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Prepare user data - only include student fields if role is student
        const userData = {
            email: userEmail,
            password_hash,
            full_name: userName,
            role: userRole,
            gender: gender || null
        };

        // Only include student-specific fields for student role
        if (userRole === 'student') {
            userData.register_number = register_number || null;
            userData.year_of_study = year_of_study || null;
            userData.section = section || null;
        }

        console.log('📝 Creating user:', { ...userData, password_hash: '***' });

        const { data: user, error } = await supabase
            .from('users')
            .insert(userData)
            .select('id, email, full_name, role, register_number, year_of_study, section, gender, created_at')
            .single();

        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }

        console.log('✅ User created successfully:', user.id);

        res.status(201).json({ message: 'User created successfully.', user });
    } catch (err) {
        console.error('Admin create user error:', err);
        res.status(500).json({ error: 'Failed to create user.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};
        ['role','full_name','year_of_study','section','gender','register_number'].forEach(k => {
            if (req.body[k] !== undefined) updates[k] = req.body[k];
        });
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
        if (error) throw error;
        res.json({ message: 'User updated.', user: data });
    } catch (err) { console.error('Update user error:', err); res.status(500).json({ error: 'Failed to update user.' }); }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'User deleted.' });
    } catch (err) { console.error('Delete user error:', err); res.status(500).json({ error: 'Failed to delete user.' }); }
};

exports.moveStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_of_study, section } = req.body;
        if (!year_of_study || !section) return res.status(400).json({ error: 'Year and section required.' });
        const { data, error } = await supabase.from('users')
            .update({ year_of_study, section, updated_at: new Date().toISOString() })
            .eq('id', id).eq('role', 'student').select().single();
        if (error) throw error;
        res.json({ message: 'Student moved.', user: data });
    } catch (err) { console.error('Move student error:', err); res.status(500).json({ error: 'Failed to move student.' }); }
};

// ─── CLASS MANAGEMENT ────────────────────────────────────────
exports.getClasses = async (req, res) => {
    try {
        const { data: cm, error } = await supabase.from('classes_meta').select('*').order('year').order('section');
        if (error) throw error;
        const { data: students } = await supabase.from('users').select('id, year_of_study, section, gender').eq('role', 'student');
        const { data: allA } = await supabase.from('assignments').select('id, target_year, target_section, deadline');
        const { data: allS } = await supabase.from('submissions').select('id, assignment_id, student_id, status, marks_obtained');
        const enriched = (cm || []).map(c => {
            const cs = (students || []).filter(s => s.year_of_study === c.year && s.section === c.section);
            const ca = (allA || []).filter(a => a.target_year === c.year && (!a.target_section || a.target_section === c.section));
            const sids = cs.map(s => s.id);
            const csubs = (allS || []).filter(s => sids.includes(s.student_id));
            const ev = csubs.filter(s => s.status === 'evaluated');
            return { ...c, actual_students: cs.length, actual_boys: cs.filter(s => s.gender === 'male').length,
                actual_girls: cs.filter(s => s.gender === 'female').length, total_assignments: ca.length,
                active_assignments: ca.filter(a => new Date(a.deadline) > new Date()).length,
                total_submissions: csubs.length, evaluated_submissions: ev.length,
                avg_score: ev.length > 0 ? Math.round(ev.reduce((s, e) => s + (e.marks_obtained || 0), 0) / ev.length) : 0
            };
        });
        res.json({ classes: enriched });
    } catch (err) { console.error('Get classes error:', err); res.status(500).json({ error: 'Failed to fetch classes.' }); }
};

exports.addUpdateClass = async (req, res) => {
    try {
        const { year, section, total_boys, total_girls } = req.body;
        if (!year || !section) return res.status(400).json({ error: 'Year and section required.' });
        const { data, error } = await supabase.from('classes_meta')
            .upsert({ year, section, total_boys: total_boys || 0, total_girls: total_girls || 0 }, { onConflict: 'year, section' })
            .select().single();
        if (error) throw error;
        res.json({ message: 'Class saved.', classMeta: data });
    } catch (err) { console.error('Add/Update class error:', err); res.status(500).json({ error: 'Failed to save class.' }); }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('classes_meta').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Class deleted.' });
    } catch (err) { console.error('Delete class error:', err); res.status(500).json({ error: 'Failed to delete class.' }); }
};

// ─── CLASS REPORT (DRILL-DOWN) ───────────────────────────────
exports.getClassReport = async (req, res) => {
    try {
        const { year, section } = req.params;
        const { data: students } = await supabase.from('users')
            .select('id, full_name, email, register_number, gender, created_at')
            .eq('role', 'student').eq('year_of_study', year).eq('section', section).order('full_name');
        const { data: classAssignments } = await supabase.from('assignments')
            .select('id, title, type, total_marks, deadline, teacher_id, subject')
            .or(`and(target_year.eq.${year},target_section.eq.${section}),and(target_year.eq.${year},target_section.is.null)`);
        const sids = (students || []).map(s => s.id);
        let submissions = [];
        if (sids.length > 0) {
            const { data: subs } = await supabase.from('submissions')
                .select('id, student_id, assignment_id, status, marks_obtained, is_late, submitted_at')
                .in('student_id', sids);
            submissions = subs || [];
        }
        const totalA = (classAssignments || []).length;
        const enriched = (students || []).map(student => {
            const ss = submissions.filter(s => s.student_id === student.id);
            const ev = ss.filter(s => s.status === 'evaluated');
            const mo = ev.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
            const mp = ev.reduce((sum, s) => {
                const a = (classAssignments || []).find(a => a.id === s.assignment_id);
                return sum + (a?.total_marks || 100);
            }, 0);
            return { ...student, total_tests: totalA, submitted: ss.length, evaluated: ev.length,
                avg_score: mp > 0 ? Math.round((mo / mp) * 100) : 0,
                total_marks_obtained: mo, total_marks_possible: mp,
                submission_rate: totalA > 0 ? Math.round((ss.length / totalA) * 100) : 0,
                late_count: ss.filter(s => s.is_late).length };
        });
        enriched.sort((a, b) => b.avg_score - a.avg_score);
        enriched.forEach((s, i) => { s.rank = i + 1; });
        const allEv = submissions.filter(s => s.status === 'evaluated');
        res.json({ report: {
            year, section, total_students: (students || []).length,
            boys: (students || []).filter(s => s.gender === 'male').length,
            girls: (students || []).filter(s => s.gender === 'female').length,
            total_tests: totalA, total_submissions: submissions.length,
            avg_class_score: allEv.length > 0 ? Math.round(allEv.reduce((s, e) => s + (e.marks_obtained || 0), 0) / allEv.length) : 0,
            completion_rate: sids.length * totalA > 0 ? Math.round((submissions.length / (sids.length * totalA)) * 100) : 0,
            late_rate: submissions.length > 0 ? Math.round((submissions.filter(s => s.is_late).length / submissions.length) * 100) : 0,
            students: enriched, assignments: classAssignments || []
        }});
    } catch (err) { console.error('Get class report error:', err); res.status(500).json({ error: 'Failed to fetch class report.' }); }
};

// ─── STUDENT DETAIL REPORT ───────────────────────────────────
exports.getStudentReport = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { data: student, error: sErr } = await supabase.from('users')
            .select('id, full_name, email, register_number, year_of_study, section, gender, created_at')
            .eq('id', studentId).single();
        if (sErr || !student) return res.status(404).json({ error: 'Student not found.' });
        const { data: submissions } = await supabase.from('submissions')
            .select('*, assignments(id, title, type, total_marks, deadline, subject, teacher_id, users!assignments_teacher_id_fkey(full_name))')
            .eq('student_id', studentId).order('submitted_at', { ascending: false });
        const subs = submissions || [];
        const ev = subs.filter(s => s.status === 'evaluated');
        const mo = ev.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
        const mp = ev.reduce((sum, s) => sum + (s.assignments?.total_marks || 100), 0);
        // Timeline
        const perfMap = {};
        ev.forEach(s => {
            const m = new Date(s.submitted_at).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!perfMap[m]) perfMap[m] = { marks: 0, total: 0, count: 0 };
            perfMap[m].marks += s.marks_obtained || 0;
            perfMap[m].total += s.assignments?.total_marks || 100;
            perfMap[m].count++;
        });
        const performance_timeline = Object.entries(perfMap).map(([month, d]) => ({
            month, avg: d.total > 0 ? Math.round((d.marks / d.total) * 100) : 0, count: d.count }));
        // Subject breakdown
        const subjMap = {};
        ev.forEach(s => {
            const subj = s.assignments?.subject || 'General';
            if (!subjMap[subj]) subjMap[subj] = { marks: 0, total: 0, count: 0 };
            subjMap[subj].marks += s.marks_obtained || 0;
            subjMap[subj].total += s.assignments?.total_marks || 100;
            subjMap[subj].count++;
        });
        const subject_breakdown = Object.entries(subjMap).map(([subject, d]) => ({
            subject, avg: d.total > 0 ? Math.round((d.marks / d.total) * 100) : 0, tests: d.count }));
        res.json({ student, report: {
            total_submissions: subs.length, evaluated: ev.length,
            pending: subs.filter(s => s.status === 'pending').length,
            late_submissions: subs.filter(s => s.is_late).length,
            avg_score: mp > 0 ? Math.round((mo / mp) * 100) : 0,
            total_marks_obtained: mo, total_marks_possible: mp,
            performance_timeline, subject_breakdown, submissions: subs
        }});
    } catch (err) { console.error('Get student report error:', err); res.status(500).json({ error: 'Failed to fetch student report.' }); }
};

// ─── ASSIGNMENT MANAGEMENT ───────────────────────────────────
exports.getAllAssignments = async (req, res) => {
    try {
        const { data, error } = await supabase.from('assignments')
            .select('*, users!assignments_teacher_id_fkey(full_name, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        const { data: subCounts } = await supabase.from('submissions').select('assignment_id');
        const cm = {};
        (subCounts || []).forEach(s => { cm[s.assignment_id] = (cm[s.assignment_id] || 0) + 1; });
        res.json({ assignments: (data || []).map(a => ({ ...a, submission_count: cm[a.id] || 0 })) });
    } catch (err) { console.error('Admin get assignments error:', err); res.status(500).json({ error: 'Failed to fetch assignments.' }); }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Assignment deleted with all submissions.' });
    } catch (err) { console.error('Delete assignment error:', err); res.status(500).json({ error: 'Failed to delete assignment.' }); }
};

// ─── LEADERBOARD ─────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
    try {
        const { year, section } = req.query;
        let sq = supabase.from('users')
            .select('id, full_name, register_number, year_of_study, section, gender')
            .eq('role', 'student');
        if (year) sq = sq.eq('year_of_study', year);
        if (section) sq = sq.eq('section', section);
        const { data: students } = await sq;
        const sids = (students || []).map(s => s.id);
        if (sids.length === 0) return res.json({ leaderboard: [] });
        const { data: submissions } = await supabase.from('submissions')
            .select('student_id, status, marks_obtained, is_late, assignment_id').in('student_id', sids);
        const { data: assignments } = await supabase.from('assignments').select('id, total_marks, points_ontime, points_late');
        const lb = (students || []).map(student => {
            const ss = (submissions || []).filter(s => s.student_id === student.id);
            const ev = ss.filter(s => s.status === 'evaluated');
            const mo = ev.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
            const mp = ev.reduce((sum, s) => {
                const a = (assignments || []).find(x => x.id === s.assignment_id);
                return sum + (a?.total_marks || 100);
            }, 0);
            let pts = 0;
            ss.forEach(s => {
                const a = (assignments || []).find(x => x.id === s.assignment_id);
                pts += s.is_late ? (a?.points_late || 5) : (a?.points_ontime || 10);
            });
            return { ...student, submissions: ss.length, evaluated: ev.length,
                avg_score: mp > 0 ? Math.round((mo / mp) * 100) : 0,
                total_marks: mo, points: pts };
        });
        lb.sort((a, b) => b.avg_score - a.avg_score || b.points - a.points);
        lb.forEach((s, i) => { s.rank = i + 1; });
        res.json({ leaderboard: lb });
    } catch (err) { console.error('Get leaderboard error:', err); res.status(500).json({ error: 'Failed to fetch leaderboard.' }); }
};

// ─── SUBJECT MANAGEMENT ──────────────────────────────────────
exports.getSubjects = async (req, res) => {
    try {
        const { data, error } = await supabase.from('subjects').select('*').order('name');
        if (error) throw error;
        res.json({ subjects: data || [] });
    } catch (err) { console.error('Get subjects error:', err); res.status(500).json({ error: 'Failed to fetch subjects.' }); }
};
exports.addSubject = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name) return res.status(400).json({ error: 'Subject name required.' });
        const { data, error } = await supabase.from('subjects').insert({ name, code: code || null }).select().single();
        if (error) throw error;
        res.json({ message: 'Subject added.', subject: data });
    } catch (err) { console.error('Add subject error:', err); res.status(500).json({ error: 'Failed to add subject.' }); }
};
exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Subject deleted.' });
    } catch (err) { console.error('Delete subject error:', err); res.status(500).json({ error: 'Failed to delete subject.' }); }
};

// ─── TEACHER ASSIGNMENT MANAGEMENT ───────────────────────────
exports.getTeacherAssignmentsList = async (req, res) => {
    try {
        const { data, error } = await supabase.from('teacher_assignments')
            .select('*, users!teacher_assignments_teacher_id_fkey(full_name, email), subjects(name, code)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ teacher_assignments: data || [] });
    } catch (err) { console.error('Get teacher assignments error:', err); res.status(500).json({ error: 'Failed to fetch teacher assignments.' }); }
};

exports.assignTeacher = async (req, res) => {
    try {
        const { teacher_id, year, section, subject_id, academic_year } = req.body;
        const normalizedYear = normalizeText(year);
        const normalizedSection = normalizeText(section).toUpperCase();
        const normalizedAcademicYear = normalizeText(academic_year) || '2025-2026';
        const normalizedSubjectId = subject_id || null;

        if (!teacher_id || !normalizedYear || !normalizedSection) {
            return res.status(400).json({ error: 'Teacher, year, section required.' });
        }

        console.log('🎓 Assigning teacher:', { teacher_id, year: normalizedYear, section: normalizedSection, subject_id: normalizedSubjectId });

        const { data: teacher, error: teacherErr } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('id', teacher_id)
            .eq('role', 'teacher')
            .single();

        if (teacherErr || !teacher) {
            console.error('❌ Teacher not found:', teacherErr);
            return res.status(400).json({ error: 'Selected user is not a valid teacher.' });
        }

        const conflicts = await findAssignmentConflicts({
            year: normalizedYear,
            section: normalizedSection,
            subject_id: normalizedSubjectId
        });

        let data;
        if (conflicts.length > 0) {
            const primary = conflicts[0];

            const { data: updated, error: updErr } = await supabase
                .from('teacher_assignments')
                .update({
                    teacher_id,
                    year: normalizedYear,
                    section: normalizedSection,
                    subject_id: normalizedSubjectId,
                    academic_year: normalizedAcademicYear,
                    updated_at: new Date().toISOString()
                })
                .eq('id', primary.id)
                .select('*, users!teacher_assignments_teacher_id_fkey(full_name, email), subjects(name, code)')
                .single();

            if (updErr) throw updErr;

            if (conflicts.length > 1) {
                const duplicateIds = conflicts.slice(1).map(c => c.id);
                await supabase.from('teacher_assignments').delete().in('id', duplicateIds);
            }

            data = updated;
            console.log('✅ Teacher assignment updated:', data.id);
        } else {
            const { data: created, error } = await supabase.from('teacher_assignments')
                .insert({
                    teacher_id,
                    year: normalizedYear,
                    section: normalizedSection,
                    subject_id: normalizedSubjectId,
                    academic_year: normalizedAcademicYear
                })
                .select('*, users!teacher_assignments_teacher_id_fkey(full_name, email), subjects(name, code)')
                .single();
            if (error) throw error;
            data = created;
            console.log('✅ Teacher assignment created:', data.id);
        }

        const assignmentType = normalizedSubjectId ? 'Subject teacher' : 'Class teacher';
        res.json({ message: `${assignmentType} assigned/updated successfully.`, assignment: data });
    } catch (err) {
        console.error('❌ Assign teacher error:', err);
        res.status(500).json({ error: 'Failed to assign teacher.' });
    }
};

exports.updateTeacherAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacher_id, year, section, subject_id, academic_year } = req.body;

        if (!teacher_id || !year || !section) {
            return res.status(400).json({ error: 'Teacher, year, section required.' });
        }

        const normalizedYear = normalizeText(year);
        const normalizedSection = normalizeText(section).toUpperCase();
        const normalizedAcademicYear = normalizeText(academic_year) || '2025-2026';
        const normalizedSubjectId = subject_id || null;

        const { data: teacher, error: teacherErr } = await supabase
            .from('users')
            .select('id')
            .eq('id', teacher_id)
            .eq('role', 'teacher')
            .single();
        if (teacherErr || !teacher) {
            return res.status(400).json({ error: 'Selected user is not a valid teacher.' });
        }

        const conflicts = await findAssignmentConflicts({
            year: normalizedYear,
            section: normalizedSection,
            subject_id: normalizedSubjectId,
            excludeId: id
        });

        if (conflicts.length > 0) {
            await supabase.from('teacher_assignments').delete().in('id', conflicts.map(c => c.id));
        }

        const { data, error } = await supabase
            .from('teacher_assignments')
            .update({
                teacher_id,
                year: normalizedYear,
                section: normalizedSection,
                subject_id: normalizedSubjectId,
                academic_year: normalizedAcademicYear,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*, users!teacher_assignments_teacher_id_fkey(full_name, email), subjects(name, code)')
            .single();

        if (error) throw error;
        res.json({ message: 'Teacher assignment updated.', assignment: data });
    } catch (err) {
        console.error('Update teacher assignment error:', err);
        res.status(500).json({ error: 'Failed to update teacher assignment.' });
    }
};

exports.removeTeacherAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Removing teacher assignment:', id);
        
        const { error } = await supabase.from('teacher_assignments').delete().eq('id', id);
        if (error) throw error;
        
        console.log('✅ Teacher assignment removed:', id);
        res.json({ message: 'Teacher assignment removed.' });
    } catch (err) {
        console.error('❌ Remove teacher assignment error:', err);
        res.status(500).json({ error: 'Failed to remove.' });
    }
};

exports.getTeacherDetail = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { data: teacher } = await supabase.from('users')
            .select('id, full_name, email, gender, created_at').eq('id', teacherId).eq('role', 'teacher').single();
        if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
        const { data: ta } = await supabase.from('teacher_assignments')
            .select('*, subjects(name, code)').eq('teacher_id', teacherId);
        const { data: assignments } = await supabase.from('assignments')
            .select('id, title, type, total_marks, deadline, target_year, target_section, subject')
            .eq('teacher_id', teacherId).order('created_at', { ascending: false });
        res.json({ teacher, class_assignments: ta || [], assignments: assignments || [] });
    } catch (err) { console.error('Get teacher detail error:', err); res.status(500).json({ error: 'Failed to fetch teacher details.' }); }
};

// ─── ALL SUBMISSIONS ─────────────────────────────────────────
exports.getAllSubmissions = async (req, res) => {
    try {
        const { data, error } = await supabase.from('submissions')
            .select('*, users!submissions_student_id_fkey(full_name, email, register_number), assignments(title, type, total_marks)')
            .order('submitted_at', { ascending: false }).limit(200);
        if (error) throw error;
        res.json({ submissions: data || [] });
    } catch (err) { console.error('Get all submissions error:', err); res.status(500).json({ error: 'Failed to fetch submissions.' }); }
};
