const User = require('../models/User');

// GET /api/users?role=&department=&status=&q=
exports.listUsers = async (req, res) => {
  try {
    const { role, department, status, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

// PATCH /api/users/:id/role  (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['employee', 'departmentHead', 'assetManager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true })
      .select('-password')
      .populate('department', 'name code');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update role.', error: err.message });
  }
};

// PATCH /api/users/:id/status  (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'status must be Active or Inactive.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .select('-password')
      .populate('department', 'name code');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update status.', error: err.message });
  }
};

// PATCH /api/users/:id/department  (Admin only)
exports.updateUserDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { department: department || null },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('department', 'name code');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update department.', error: err.message });
  }
};