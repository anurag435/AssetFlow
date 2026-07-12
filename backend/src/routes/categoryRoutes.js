const express = require('express');
const categoryRouter = express.Router();
const { listCategories, createCategory, updateCategory } = require('../controllers/categoryController');
const { protect, requireRole } = require('../middlewares/auth');

categoryRouter.get('/', protect, listCategories);
categoryRouter.post('/', protect, requireRole('admin'), createCategory);
categoryRouter.put('/:id', protect, requireRole('admin'), updateCategory);

module.exports = categoryRouter;
