const supabase = require('../config/supabase');

// Submit late reason
exports.submit = async (req, res) => {
    try {
        const { submission_id, reason } = req.body;

        if (!submission_id || !reason) {
            return res.status(400).json({ error: 'Submission ID and reason are required.' });
        }

        const { data, error } = await supabase
            .from('late_requests')
            .insert({
                submission_id,
                student_id: req.user.id,
                reason
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Late reason submitted.', late_request: data });
    } catch (err) {
        console.error('Late request error:', err);
        res.status(500).json({ error: 'Failed to submit late reason.' });
    }
};

// Get late requests (teacher)
exports.getAll = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('late_requests')
            .select('*, users!late_requests_student_id_fkey(full_name, email), submissions(assignment_id, assignments(title))')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ late_requests: data || [] });
    } catch (err) {
        console.error('Get late requests error:', err);
        res.status(500).json({ error: 'Failed to fetch late requests.' });
    }
};

// Approve/reject late request (teacher)
exports.review = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected.' });
        }

        const { data, error } = await supabase
            .from('late_requests')
            .update({
                status,
                reviewed_by: req.user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: `Late request ${status}.`, late_request: data });
    } catch (err) {
        console.error('Review late request error:', err);
        res.status(500).json({ error: 'Failed to review late request.' });
    }
};
