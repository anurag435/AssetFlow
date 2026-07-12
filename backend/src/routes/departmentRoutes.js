const express = require('express');
const router = express.Router();
const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
} = require('../controllers/departmentController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', protect, listDepartments); // anyone logged in can view
router.post('/', protect, requireRole('admin'), createDepartment);
router.put('/:id', protect, requireRole('admin'), updateDepartment);
router.patch('/:id/deactivate', protect, requireRole('admin'), deactivateDepartment);

module.exports = router;
