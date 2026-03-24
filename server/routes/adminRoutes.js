const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireRole('admin'));

// Dashboard
router.get('/stats', admin.getStats);

// Users
router.get('/users', admin.getUsers);
router.post('/users', admin.createUser);
router.put('/users/:id', admin.updateUser);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.patch('/users/:id/move', admin.moveStudent);

// Classes
router.get('/classes', admin.getClasses);
router.post('/classes', admin.addUpdateClass);
router.delete('/classes/:id', admin.deleteClass);

// Class drill-down reports
router.get('/classes/:year/:section/report', admin.getClassReport);

// Student detail report
router.get('/students/:studentId/report', admin.getStudentReport);

// Assignments
router.get('/assignments', admin.getAllAssignments);
router.delete('/assignments/:id', admin.deleteAssignment);

// Leaderboard
router.get('/leaderboard', admin.getLeaderboard);

// Subjects
router.get('/subjects', admin.getSubjects);
router.post('/subjects', admin.addSubject);
router.delete('/subjects/:id', admin.deleteSubject);

// Teacher assignments (class/subject)
router.get('/teacher-assignments', admin.getTeacherAssignmentsList);
router.post('/teacher-assignments', admin.assignTeacher);
router.put('/teacher-assignments/:id', admin.updateTeacherAssignment);
router.patch('/teacher-assignments/:id', admin.updateTeacherAssignment);
router.delete('/teacher-assignments/:id', admin.removeTeacherAssignment);
router.get('/teachers/:teacherId', admin.getTeacherDetail);

// All submissions
router.get('/submissions', admin.getAllSubmissions);

module.exports = router;
