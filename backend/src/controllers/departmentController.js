const Department = require('../models/Department');

exports.listDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code');
    return res.json(departments);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch departments.', error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, head, parentDepartment } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required.' });
    }

    const department = await Department.create({ name, code, head, parentDepartment });
    return res.status(201).json(department);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A department with this code already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create department.', error: err.message });
  }
};

// PUT /api/departments/:id  (Admin only)
exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, head, parentDepartment, status } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, head, parentDepartment, status },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    return res.json(department);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update department.', error: err.message });
  }
};

// PATCH /api/departments/:id/deactivate  (Admin only)
exports.deactivateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { status: 'Inactive' },
      { new: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    return res.json(department);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to deactivate department.', error: err.message });
  }
};