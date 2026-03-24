const supabase = require('../config/supabase');

// Create assignment (teacher)
exports.create = async (req, res) => {
    try {
        const { title, description, type, deadline, total_marks, mcq_duration, result_publish_date, questions, points_ontime, points_late, subject, assign_to } = req.body;

        if (!title || !deadline || !type) {
            return res.status(400).json({ error: 'Title, type, and deadline are required.' });
        }

        // Create assignment
        const { data: assignment, error } = await supabase
            .from('assignments')
            .insert({
                teacher_id: req.user.id,
                title,
                description,
                type,
                deadline,
                total_marks: total_marks || 100,
                mcq_duration: mcq_duration || 0,
                result_publish_date: result_publish_date || null,
                target_year: req.body.target_year,
                target_section: req.body.target_section,
                points_ontime: points_ontime || 10,
                points_late: points_late || 5,
                subject: subject || null,
                assign_to: assign_to || 'all'
            })
            .select()
            .single();

        if (error) throw error;

        // If MCQ type, add questions
        if (type === 'mcq' && questions && questions.length > 0) {
            const mcqData = questions.map(q => ({
                assignment_id: assignment.id,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: (q.correct_answer || 'a').toLowerCase(),
                marks: q.marks || 1
            }));

            console.log(`Inserting ${mcqData.length} MCQ questions for assignment ${assignment.id}`);

            const { data: insertedQuestions, error: mcqError } = await supabase
                .from('mcq_questions')
                .insert(mcqData)
                .select();

            if (mcqError) {
                console.error('MCQ insert error:', mcqError);
                throw mcqError;
            }

            console.log(`Successfully inserted ${insertedQuestions?.length || 0} questions`);
            assignment.questions = insertedQuestions;
        }

        res.status(201).json({ message: 'Assignment created successfully.', assignment });
    } catch (err) {
        console.error('Create assignment error:', err.message || err);
        console.error('Full error:', JSON.stringify(err, null, 2));
        res.status(500).json({ error: 'Failed to create assignment.', details: err.message || err.details || err.hint || String(err) });
    }
};

// Get all assignments (with filters)
exports.getAll = async (req, res) => {
    try {
        let query = supabase
            .from('assignments')
            .select('*, users!assignments_teacher_id_fkey(full_name, email)')
            .order('created_at', { ascending: false });

        // Students only see visible assignments
        if (req.user.role === 'student') {
            query = query.eq('is_visible', true);
        }

        // Teachers see their own assignments
        if (req.user.role === 'teacher') {
            query = query.eq('teacher_id', req.user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ assignments: data || [] });
    } catch (err) {
        console.error('Get assignments error:', err);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
};

// Get single assignment
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: assignment, error } = await supabase
            .from('assignments')
            .select('*, users!assignments_teacher_id_fkey(full_name, email)')
            .eq('id', id)
            .single();

        if (error || !assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // If MCQ, include questions (without answers for students)
        if (assignment.type === 'mcq') {
            let qSelect = 'id, question_text, option_a, option_b, option_c, option_d, marks';
            if (req.user.role !== 'student') {
                qSelect += ', correct_answer';
            }

            const { data: questions, error: qError } = await supabase
                .from('mcq_questions')
                .select(qSelect)
                .eq('assignment_id', id);

            if (qError) {
                console.error('Error fetching MCQ questions:', qError);
            }

            assignment.questions = questions || [];
            console.log(`getById ${id}: Found ${assignment.questions.length} MCQ questions`);
        }

        res.json({ assignment });
    } catch (err) {
        console.error('Get assignment error:', err);
        res.status(500).json({ error: 'Failed to fetch assignment.' });
    }
};

// Update assignment (teacher)
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('assignments')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('teacher_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Assignment updated.', assignment: data });
    } catch (err) {
        console.error('Update assignment error:', err);
        res.status(500).json({ error: 'Failed to update assignment.' });
    }
};

// Delete assignment (teacher)
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', id)
            .eq('teacher_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Assignment deleted.' });
    } catch (err) {
        console.error('Delete assignment error:', err);
        res.status(500).json({ error: 'Failed to delete assignment.' });
    }
};

// Toggle visibility (admin)
exports.toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: assignment } = await supabase
            .from('assignments')
            .select('is_visible')
            .eq('id', id)
            .single();

        const { data, error } = await supabase
            .from('assignments')
            .update({ is_visible: !assignment.is_visible })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Visibility toggled.', assignment: data });
    } catch (err) {
        console.error('Toggle visibility error:', err);
        res.status(500).json({ error: 'Failed to toggle visibility.' });
    }
};
