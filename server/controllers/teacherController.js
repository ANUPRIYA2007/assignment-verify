const supabase = require('../config/supabase');

const normalizeClassKey = (year, section) => `${String(year).trim()}|${String(section).trim()}`;

const getAllowedClassSet = async (user) => {
    if (!user || user.role === 'admin') return null;

    const { data, error } = await supabase
        .from('teacher_assignments')
        .select('year, section')
        .eq('teacher_id', user.id);

    if (error) throw error;

    return new Set((data || []).map(c => normalizeClassKey(c.year, c.section)));
};

const ensureClassAccess = async (user, year, section) => {
    const allowedSet = await getAllowedClassSet(user);
    if (!allowedSet) return true;
    return allowedSet.has(normalizeClassKey(year, section));
};

// Get classes taught by this teacher (from classes_meta)
exports.getClasses = async (req, res) => {
    try {
        const allowedSet = await getAllowedClassSet(req.user);

        const { data, error } = await supabase
            .from('classes_meta')
            .select('*')
            .order('year', { ascending: true })
            .order('section', { ascending: true });

        if (error) throw error;

        const filtered = allowedSet
            ? (data || []).filter(c => allowedSet.has(normalizeClassKey(c.year, c.section)))
            : (data || []);

        res.json({ classes: filtered });
    } catch (err) {
        console.error('Get teacher classes error:', err);
        res.status(500).json({ error: 'Failed to fetch classes.' });
    }
};

// Get students in a specific class (year + section)
exports.getClassStudents = async (req, res) => {
    try {
        const { year, section } = req.params;
        const { gender } = req.query; // optional filter: 'male' or 'female'

        const hasAccess = await ensureClassAccess(req.user, year, section);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied for this class.' });
        }

        let query = supabase
            .from('users')
            .select('id, full_name, email, register_number, year_of_study, section, gender, created_at')
            .eq('role', 'student')
            .eq('year_of_study', year)
            .eq('section', section)
            .order('full_name', { ascending: true });

        if (gender) {
            query = query.eq('gender', gender);
        }

        const { data: students, error } = await query;
        if (error) throw error;

        // For each student, get their submission stats
        const studentIds = (students || []).map(s => s.id);

        let submissionStats = [];
        if (studentIds.length > 0) {
            const { data: subs } = await supabase
                .from('submissions')
                .select('student_id, status, marks_obtained, assignment_id, is_late')
                .in('student_id', studentIds);

            submissionStats = subs || [];
        }

        // Get assignments targeted at this class
        const { data: classAssignments } = await supabase
            .from('assignments')
            .select('id, total_marks')
            .eq('teacher_id', req.user.id)
            .or(`target_year.eq.${year},target_year.is.null`);

        const totalAssignments = classAssignments?.length || 0;
        const totalMCQ = classAssignments?.filter(a => a.type === 'mcq').length || 0;

        const enrichedStudents = (students || []).map(student => {
            const studentSubs = submissionStats.filter(s => s.student_id === student.id);
            const evaluated = studentSubs.filter(s => s.status === 'evaluated');
            const totalMarks = evaluated.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
            const maxMarks = evaluated.length > 0
                ? classAssignments?.filter(a => evaluated.some(e => e.assignment_id === a.id))
                    .reduce((sum, a) => sum + (a.total_marks || 100), 0)
                : 0;

            return {
                ...student,
                assignments_completed: studentSubs.length,
                total_assignments: totalAssignments,
                evaluated_count: evaluated.length,
                total_marks_obtained: totalMarks,
                total_marks_possible: maxMarks,
                avg_score: maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0,
                late_count: studentSubs.filter(s => s.is_late).length
            };
        });

        res.json({ students: enrichedStudents });
    } catch (err) {
        console.error('Get class students error:', err);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

// Get class analytics (performance, completion, avg scores)
exports.getClassAnalytics = async (req, res) => {
    try {
        const { year, section } = req.params;

        const hasAccess = await ensureClassAccess(req.user, year, section);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied for this class.' });
        }

        // Get students in this class
        const { data: students } = await supabase
            .from('users')
            .select('id, gender')
            .eq('role', 'student')
            .eq('year_of_study', year)
            .eq('section', section);

        const studentIds = (students || []).map(s => s.id);
        const boysCount = (students || []).filter(s => s.gender === 'male').length;
        const girlsCount = (students || []).filter(s => s.gender === 'female').length;

        // Get assignments for this class by this teacher
        let assignmentsQuery = supabase
            .from('assignments')
            .select('id, title, type, total_marks, deadline, created_at, target_year, target_section, points_ontime, points_late')
            .eq('teacher_id', req.user.id)
            .eq('target_year', year);

        // section can be null (all sections) or specific
        const { data: assignments } = await assignmentsQuery;

        // Filter: assignments for this section OR all sections (null)
        const classAssignments = (assignments || []).filter(
            a => !a.target_section || a.target_section === section
        );

        // Get submissions from these students
        let submissions = [];
        if (studentIds.length > 0) {
            const { data: subs } = await supabase
                .from('submissions')
                .select('id, student_id, assignment_id, status, marks_obtained, is_late, submitted_at')
                .in('student_id', studentIds);
            submissions = subs || [];
        }

        // Calculate analytics
        const totalAssignments = classAssignments.length;
        const activeAssignments = classAssignments.filter(a => new Date(a.deadline) > new Date()).length;
        const totalSubmissions = submissions.length;
        const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');
        const pendingSubmissions = submissions.filter(s => s.status === 'pending');

        // Average score across all evaluated submissions
        const totalMarksObtained = evaluatedSubmissions.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
        const totalMarksPossible = evaluatedSubmissions.reduce((sum, s) => {
            const asgn = classAssignments.find(a => a.id === s.assignment_id);
            return sum + (asgn?.total_marks || 100);
        }, 0);
        const avgScore = totalMarksPossible > 0 ? Math.round((totalMarksObtained / totalMarksPossible) * 100) : 0;

        // Completion rate
        const expectedSubmissions = studentIds.length * totalAssignments;
        const completionRate = expectedSubmissions > 0 ? Math.round((totalSubmissions / expectedSubmissions) * 100) : 0;

        // Late submission rate
        const lateCount = submissions.filter(s => s.is_late).length;
        const lateRate = totalSubmissions > 0 ? Math.round((lateCount / totalSubmissions) * 100) : 0;

        // Top performers (by avg marks %)
        const studentPerformance = studentIds.map(sid => {
            const studentSubs = evaluatedSubmissions.filter(s => s.student_id === sid);
            const marks = studentSubs.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
            const maxM = studentSubs.reduce((sum, s) => {
                const asgn = classAssignments.find(a => a.id === s.assignment_id);
                return sum + (asgn?.total_marks || 100);
            }, 0);
            const student = students.find(st => st.id === sid);
            return { id: sid, avg: maxM > 0 ? Math.round((marks / maxM) * 100) : 0, gender: student?.gender };
        });
        studentPerformance.sort((a, b) => b.avg - a.avg);

        // Per-assignment completion
        const assignmentStats = classAssignments.map(a => {
            const asgnSubs = submissions.filter(s => s.assignment_id === a.id);
            return {
                id: a.id,
                title: a.title,
                type: a.type,
                total_marks: a.total_marks,
                deadline: a.deadline,
                submissions_count: asgnSubs.length,
                evaluated_count: asgnSubs.filter(s => s.status === 'evaluated').length,
                expected: studentIds.length,
                completion: studentIds.length > 0 ? Math.round((asgnSubs.length / studentIds.length) * 100) : 0,
                avg_marks: asgnSubs.filter(s => s.marks_obtained !== null).length > 0
                    ? Math.round(asgnSubs.filter(s => s.marks_obtained !== null).reduce((sum, s) => sum + s.marks_obtained, 0) / asgnSubs.filter(s => s.marks_obtained !== null).length)
                    : 0
            };
        });

        res.json({
            analytics: {
                total_students: studentIds.length,
                boys: boysCount,
                girls: girlsCount,
                total_assignments: totalAssignments,
                active_assignments: activeAssignments,
                total_submissions: totalSubmissions,
                evaluated_count: evaluatedSubmissions.length,
                pending_count: pendingSubmissions.length,
                avg_score: avgScore,
                completion_rate: completionRate,
                late_rate: lateRate,
                top_performers: studentPerformance.slice(0, 5),
                assignment_stats: assignmentStats
            }
        });
    } catch (err) {
        console.error('Get class analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
};

// Get class activities (assignments for this class)
exports.getClassActivities = async (req, res) => {
    try {
        const { year, section } = req.params;

        const hasAccess = await ensureClassAccess(req.user, year, section);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied for this class.' });
        }

        const { data: assignments, error } = await supabase
            .from('assignments')
            .select('*, users!assignments_teacher_id_fkey(full_name)')
            .eq('teacher_id', req.user.id)
            .eq('target_year', year)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter: section matches or is null (all sections)
        const classActivities = (assignments || []).filter(
            a => !a.target_section || a.target_section === section
        );

        res.json({ activities: classActivities });
    } catch (err) {
        console.error('Get class activities error:', err);
        res.status(500).json({ error: 'Failed to fetch activities.' });
    }
};

// Reassign assignment to a student or entire class
exports.reassign = async (req, res) => {
    try {
        const { assignment_id, student_id, year, section } = req.body;

        if (!assignment_id) {
            return res.status(400).json({ error: 'Assignment ID is required.' });
        }

        // Verify assignment belongs to this teacher
        const { data: assignment } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignment_id)
            .eq('teacher_id', req.user.id)
            .single();

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        let deletedCount = 0;

        if (student_id) {
            // Reassign for a single student: delete their submission so they can resubmit
            const { data: deleted } = await supabase
                .from('submissions')
                .delete()
                .eq('assignment_id', assignment_id)
                .eq('student_id', student_id)
                .select();

            // Also delete student_answers for MCQ (via submission_id)
            if (assignment.type === 'mcq' && deleted && deleted.length > 0) {
                const subIds = deleted.map(s => s.id);
                await supabase
                    .from('student_answers')
                    .delete()
                    .in('submission_id', subIds);
            }

            deletedCount = deleted?.length || 0;
        } else if (year && section) {
            const hasAccess = await ensureClassAccess(req.user, year, section);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied for this class.' });
            }

            // Reassign for entire class: get student IDs in class and delete their submissions
            const { data: students } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'student')
                .eq('year_of_study', year)
                .eq('section', section);

            const studentIds = (students || []).map(s => s.id);

            if (studentIds.length > 0) {
                const { data: deleted } = await supabase
                    .from('submissions')
                    .delete()
                    .eq('assignment_id', assignment_id)
                    .in('student_id', studentIds)
                    .select();

                // Delete student_answers for MCQ (via submission_id)
                if (assignment.type === 'mcq' && deleted && deleted.length > 0) {
                    const subIds = deleted.map(s => s.id);
                    await supabase
                        .from('student_answers')
                        .delete()
                        .in('submission_id', subIds);
                }

                deletedCount = deleted?.length || 0;
            }
        } else {
            return res.status(400).json({ error: 'Provide student_id or year+section for reassignment.' });
        }

        res.json({
            message: `Reassigned successfully. ${deletedCount} submission(s) reset.`,
            deleted_count: deletedCount
        });
    } catch (err) {
        console.error('Reassign error:', err);
        res.status(500).json({ error: 'Failed to reassign.' });
    }
};

// Get student profile details (for teacher viewing)
exports.getStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;

        const { data: student, error } = await supabase
            .from('users')
            .select('id, full_name, email, register_number, year_of_study, section, gender, created_at')
            .eq('id', studentId)
            .eq('role', 'student')
            .single();

        if (error || !student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        const hasAccess = await ensureClassAccess(req.user, student.year_of_study, student.section);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied for this student.' });
        }

        // Get all submissions for this student
        const { data: submissions } = await supabase
            .from('submissions')
            .select('*, assignments(title, type, total_marks, deadline)')
            .eq('student_id', studentId)
            .order('submitted_at', { ascending: false });

        res.json({ student, submissions: submissions || [] });
    } catch (err) {
        console.error('Get student profile error:', err);
        res.status(500).json({ error: 'Failed to fetch student profile.' });
    }
};
