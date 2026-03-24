const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', assignmentController.getAll);
router.get('/:id', assignmentController.getById);
router.post('/', requireRole('teacher', 'admin'), assignmentController.create);
router.put('/:id', requireRole('teacher', 'admin'), assignmentController.update);
router.delete('/:id', requireRole('teacher', 'admin'), assignmentController.remove);
router.patch('/:id/visibility', requireRole('admin'), assignmentController.toggleVisibility);

module.exports = router;
