const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireRole('teacher', 'admin'));

// Classes
router.get('/classes', teacherController.getClasses);

// Class students
router.get('/classes/:year/:section/students', teacherController.getClassStudents);

// Class analytics
router.get('/classes/:year/:section/analytics', teacherController.getClassAnalytics);

// Class activities
router.get('/classes/:year/:section/activities', teacherController.getClassActivities);

// Student profile
router.get('/students/:studentId', teacherController.getStudentProfile);

// Reassign
router.post('/reassign', teacherController.reassign);

module.exports = router;
