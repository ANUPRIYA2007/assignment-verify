const express = require('express');
const router = express.Router();
const lateRequestController = require('../controllers/lateRequestController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('student'), lateRequestController.submit);
router.get('/', requireRole('teacher', 'admin'), lateRequestController.getAll);
router.patch('/:id', requireRole('teacher', 'admin'), lateRequestController.review);

module.exports = router;
