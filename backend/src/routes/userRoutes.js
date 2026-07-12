const express = require('express');
const userRouter = express.Router();
const {
  listUsers,
  updateUserRole,
  updateUserStatus,
  updateUserDepartment,
} = require('../controllers/userController');
const { protect, requireRole } = require('../middlewares/auth');

userRouter.get('/', protect, requireRole('admin', 'assetManager', 'departmentHead'), listUsers);
userRouter.patch('/:id/role', protect, requireRole('admin'), updateUserRole);
userRouter.patch('/:id/status', protect, requireRole('admin'), updateUserStatus);
userRouter.patch('/:id/department', protect, requireRole('admin'), updateUserDepartment);

module.exports = userRouter;