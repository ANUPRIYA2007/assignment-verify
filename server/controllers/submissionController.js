const supabase = require('../config/supabase');

// Submit file assignment
exports.submitFile = async (req, res) => {
    try {
        const { assignment_id } = req.body;

        if (!assignment_id) {
            return res.status(400).json({ error: 'Assignment ID is required.' });
        }

        // Check assignment exists and get deadline
        const { data: assignment } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignment_id)
            .single();

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Check if already submitted
        const { data: existingSub } = await supabase
            .from('submissions')
            .select('id')
            .eq('assignment_id', assignment_id)
            .eq('student_id', req.user.id)
            .single();

        if (existingSub) {
            return res.status(400).json({ error: 'You have already submitted this assignment.' });
        }

        const isLate = new Date() > new Date(assignment.deadline);
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const { data: submission, error } = await supabase
            .from('submissions')
            .insert({
                assignment_id,
                student_id: req.user.id,
                file_url: fileUrl,
                is_late: isLate,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: isLate ? 'Submitted late. Please provide a reason.' : 'Assignment submitted successfully.',
            submission,
            is_late: isLate
        });
    } catch (err) {
        console.error('Submit file error:', err);
        res.status(500).json({ error: 'Failed to submit assignment.' });
    }
};

// Submit MCQ answers
exports.submitMCQ = async (req, res) => {
    try {
        const { assignment_id, answers } = req.body;

        if (!assignment_id || !answers) {
            return res.status(400).json({ error: 'Assignment ID and answers are required.' });
        }

        // Check assignment
        const { data: assignment } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignment_id)
            .single();

        if (!assignment || assignment.type !== 'mcq') {
            return res.status(404).json({ error: 'MCQ Assignment not found.' });
        }

        // Check if already submitted
        const { data: existingSub } = await supabase
            .from('submissions')
            .select('id')
            .eq('assignment_id', assignment_id)
            .eq('student_id', req.user.id)
            .single();

        if (existingSub) {
            return res.status(400).json({ error: 'You have already submitted this test.' });
        }

        const isLate = new Date() > new Date(assignment.deadline);

        // Get correct answers
        const { data: questions } = await supabase
            .from('mcq_questions')
            .select('id, correct_answer, marks')
            .eq('assignment_id', assignment_id);

        // Create submission
        const { data: submission, error: subError } = await supabase
            .from('submissions')
            .insert({
                assignment_id,
                student_id: req.user.id,
                is_late: isLate,
                status: 'evaluated'
            })
            .select()
            .single();

        if (subError) throw subError;

        // Calculate score and save answers
        let totalMarks = 0;
        const answerRecords = answers.map(a => {
            const question = questions.find(q => q.id === a.question_id);
            const selectedLower = (a.selected_answer || '').toLowerCase();
            const correctLower = question ? (question.correct_answer || '').toLowerCase() : '';
            const isCorrect = question && correctLower === selectedLower;
            if (isCorrect) totalMarks += question.marks;

            return {
                submission_id: submission.id,
                question_id: a.question_id,
                student_id: req.user.id,
                selected_answer: selectedLower,
                is_correct: isCorrect
            };
        });

        const { error: ansError } = await supabase
            .from('student_answers')
            .insert(answerRecords);

        if (ansError) throw ansError;

        // Update submission with marks
        await supabase
            .from('submissions')
            .update({ marks_obtained: totalMarks })
            .eq('id', submission.id);

        res.status(201).json({
            message: 'MCQ test submitted and auto-evaluated.',
            marks_obtained: totalMarks,
            total_marks: assignment.total_marks,
            submission_id: submission.id
        });
    } catch (err) {
        console.error('Submit MCQ error:', err);
        res.status(500).json({ error: 'Failed to submit MCQ test.' });
    }
};

// Get submissions for an assignment (teacher)
exports.getByAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;

        const { data, error } = await supabase
            .from('submissions')
            .select('*, users!submissions_student_id_fkey(full_name, email)')
            .eq('assignment_id', assignment_id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        res.json({ submissions: data || [] });
    } catch (err) {
        console.error('Get submissions error:', err);
        res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
};

// Get student's own submissions
exports.getMySubmissions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, assignments(*)')
            .eq('student_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        res.json({ submissions: data || [] });
    } catch (err) {
        console.error('Get my submissions error:', err);
        res.status(500).json({ error: 'Failed to fetch your submissions.' });
    }
};

// Evaluate submission (teacher)
exports.evaluate = async (req, res) => {
    try {
        const { id } = req.params;
        const { marks_obtained, feedback } = req.body;

        const updates = {
            marks_obtained,
            feedback,
            status: 'evaluated'
        };

        if (req.file) {
            updates.evaluated_file_url = `/uploads/${req.file.filename}`;
        }

        const { data, error } = await supabase
            .from('submissions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Submission evaluated.', submission: data });
    } catch (err) {
        console.error('Evaluate error:', err);
        res.status(500).json({ error: 'Failed to evaluate submission.' });
    }
};

// Get results (student - only after publish date)
exports.getResults = async (req, res) => {
    try {
        const { assignment_id } = req.params;

        // Check publish date
        const { data: assignment } = await supabase
            .from('assignments')
            .select('result_publish_date, title, total_marks')
            .eq('id', assignment_id)
            .single();

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        if (assignment.result_publish_date && new Date() < new Date(assignment.result_publish_date)) {
            return res.status(403).json({
                error: 'Results are not yet published.',
                publish_date: assignment.result_publish_date
            });
        }

        const { data: submission } = await supabase
            .from('submissions')
            .select('*')
            .eq('assignment_id', assignment_id)
            .eq('student_id', req.user.id)
            .single();

        if (!submission) {
            return res.status(404).json({ error: 'No submission found.' });
        }

        // If MCQ, include detailed answers
        let answers = [];
        if (submission.status === 'evaluated') {
            const { data: ans } = await supabase
                .from('student_answers')
                .select('*, mcq_questions(question_text, option_a, option_b, option_c, option_d, correct_answer)')
                .eq('submission_id', submission.id);
            answers = ans || [];
        }

        res.json({
            assignment,
            submission,
            answers
        });
    } catch (err) {
        console.error('Get results error:', err);
        res.status(500).json({ error: 'Failed to fetch results.' });
    }
};

// Remove submission (student can reupload)
exports.removeSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'A reason is required to remove a submission.' });
        }

        // Make sure the submission belongs to the student
        const { data: submission, error: fetchErr } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', id)
            .eq('student_id', req.user.id)
            .single();

        if (fetchErr || !submission) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        // Only allow removal if not yet evaluated
        if (submission.status === 'evaluated') {
            return res.status(400).json({ error: 'Cannot remove an evaluated submission.' });
        }

        // Delete related student answers first (for MCQ)
        await supabase.from('student_answers').delete().eq('submission_id', id);

        // Delete the submission
        const { error: delErr } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id);

        if (delErr) throw delErr;

        res.json({ message: 'Submission removed successfully.' });
    } catch (err) {
        console.error('Remove submission error:', err);
        res.status(500).json({ error: 'Failed to remove submission.' });
    }
};

// Leaderboard: rank students by points
exports.getLeaderboard = async (req, res) => {
    try {
        // Get all submissions with assignment info
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('student_id, is_late, assignments(points_ontime, points_late, title)')
            .not('student_id', 'is', null);

        if (error) throw error;

        // Calculate points per student
        const pointsMap = {};
        (submissions || []).forEach(s => {
            const sid = s.student_id;
            const pts = s.is_late ? (s.assignments?.points_late || 0) : (s.assignments?.points_ontime || 0);
            if (!pointsMap[sid]) pointsMap[sid] = { points: 0, submissions: 0 };
            pointsMap[sid].points += pts;
            pointsMap[sid].submissions += 1;
        });

        // Get student names
        const studentIds = Object.keys(pointsMap);
        if (studentIds.length === 0) return res.json({ leaderboard: [] });

        const { data: students } = await supabase
            .from('users')
            .select('id, full_name, register_number, year_of_study, section, avatar_url')
            .in('id', studentIds);

        const leaderboard = (students || []).map(stu => ({
            ...stu,
            points: pointsMap[stu.id]?.points || 0,
            submissions: pointsMap[stu.id]?.submissions || 0
        })).sort((a, b) => b.points - a.points);

        // Add ranks
        leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

        res.json({ leaderboard });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard.' });
    }
};

// Subject-wise marks for current student
exports.getSubjectMarks = async (req, res) => {
    try {
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('marks_obtained, is_late, status, assignments(id, title, total_marks, type, points_ontime, points_late)')
            .eq('student_id', req.user.id);

        if (error) throw error;

        const marks = (submissions || []).map(s => ({
            assignment_id: s.assignments?.id,
            title: s.assignments?.title,
            type: s.assignments?.type,
            total_marks: s.assignments?.total_marks,
            marks_obtained: s.marks_obtained,
            status: s.status,
            is_late: s.is_late,
            points: s.is_late ? (s.assignments?.points_late || 0) : (s.assignments?.points_ontime || 0)
        }));

        const totalPoints = marks.reduce((acc, m) => acc + m.points, 0);
        const totalObtained = marks.filter(m => m.marks_obtained !== null).reduce((acc, m) => acc + m.marks_obtained, 0);
        const totalMax = marks.filter(m => m.marks_obtained !== null).reduce((acc, m) => acc + m.total_marks, 0);

        res.json({ marks, totalPoints, totalObtained, totalMax });
    } catch (err) {
        console.error('Subject marks error:', err);
        res.status(500).json({ error: 'Failed to fetch subject marks.' });
    }
};
