const express = require('express');
const departmentRoutes = express.Router();
const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
} = require('../controllers/departmentController');
const { protect, requireRole } = require('../middlewares/auth');

departmentRoutes.get('/', listDepartments);
departmentRoutes.post('/', protect, requireRole('admin'), createDepartment);
departmentRoutes.put('/:id', protect, requireRole('admin'), updateDepartment);
departmentRoutes.patch('/:id/deactivate', protect, requireRole('admin'), deactivateDepartment);

module.exports = departmentRoutes;
