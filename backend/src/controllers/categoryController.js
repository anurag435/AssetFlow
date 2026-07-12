const AssetCategory = require('../models/AssetCategory');

// GET /api/categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch categories.', error: err.message });
  }
};

// POST /api/categories  (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, customFields } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const category = await AssetCategory.create({ name, description, customFields });
    return res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A category with this name already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create category.', error: err.message });
  }
};

// PUT /api/categories/:id  (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, customFields, status } = req.body;
    const category = await AssetCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, customFields, status },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    return res.json(category);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update category.', error: err.message });
  }
};
