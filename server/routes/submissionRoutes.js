const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken);

// Student routes
router.post('/file', requireRole('student'), upload.single('file'), submissionController.submitFile);
router.post('/mcq', requireRole('student'), submissionController.submitMCQ);
router.get('/my', requireRole('student'), submissionController.getMySubmissions);
router.get('/results/:assignment_id', requireRole('student'), submissionController.getResults);
router.delete('/:id', requireRole('student'), submissionController.removeSubmission);

// Leaderboard (all authenticated users)
router.get('/leaderboard/rankings', submissionController.getLeaderboard);
// Subject-wise marks for a student
router.get('/subject-marks/my', requireRole('student'), submissionController.getSubjectMarks);

// Teacher routes
router.get('/assignment/:assignment_id', requireRole('teacher', 'admin'), submissionController.getByAssignment);
router.put('/:id/evaluate', requireRole('teacher', 'admin'), upload.single('evaluated_file'), submissionController.evaluate);

module.exports = router;
