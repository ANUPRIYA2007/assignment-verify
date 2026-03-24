const supabase = require('../config/supabase');

/**
 * Auto-Result Publisher for MCQ Assignments
 * 
 * Runs every 60 seconds and:
 * 1. Finds MCQ assignments past their deadline (or result_publish_date)
 * 2. Marks any remaining 'pending' submissions as 'evaluated' (MCQs are auto-graded)
 * 3. Logs what it publishes
 */

async function publishExpiredResults() {
    try {
        const now = new Date().toISOString();

        // Find MCQ assignments past deadline where results should be published
        const { data: assignments, error: aErr } = await supabase
            .from('assignments')
            .select('id, title, deadline, result_publish_date')
            .eq('type', 'mcq')
            .lt('deadline', now);

        if (aErr) {
            console.error('Result scheduler — query error:', aErr.message);
            return;
        }

        if (!assignments || assignments.length === 0) return;

        for (const assignment of assignments) {
            // Check if result_publish_date has passed (if set)
            if (assignment.result_publish_date && new Date(assignment.result_publish_date) > new Date()) {
                continue; // Not yet time to publish
            }

            // Find submissions that are still 'pending' for this assignment
            const { data: pendingSubs, error: sErr } = await supabase
                .from('submissions')
                .select('id')
                .eq('assignment_id', assignment.id)
                .eq('status', 'pending');

            if (sErr || !pendingSubs || pendingSubs.length === 0) continue;

            // Mark them as evaluated (MCQ scores were already computed at submission time)
            const ids = pendingSubs.map(s => s.id);

            const { error: updateErr } = await supabase
                .from('submissions')
                .update({ status: 'evaluated' })
                .in('id', ids);

            if (updateErr) {
                console.error(`Result scheduler — update error for ${assignment.title}:`, updateErr.message);
            } else {
                console.log(`📊 Auto-published results for "${assignment.title}" — ${ids.length} submission(s) evaluated.`);
            }
        }
    } catch (err) {
        console.error('Result scheduler error:', err);
    }
}

let intervalId = null;

function startResultScheduler(intervalMs = 60000) {
    console.log('⏰ Result scheduler started (every 60s)');
    // Run once immediately
    publishExpiredResults();
    // Then run periodically
    intervalId = setInterval(publishExpiredResults, intervalMs);
}

function stopResultScheduler() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏰ Result scheduler stopped');
    }
}

module.exports = { startResultScheduler, stopResultScheduler };
