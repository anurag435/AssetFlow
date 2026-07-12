const express = require('express');
const allocationRouter = express.Router();
const {
  allocateAsset,
  returnAsset,
  listAllocations,
} = require('../controllers/allocationController');
const { protect, requireRole } = require('../middlewares/auth');

allocationRouter.get('/', protect, listAllocations);
allocationRouter.post('/', protect, requireRole('admin', 'assetManager'), allocateAsset);
allocationRouter.post('/:id/return', protect, requireRole('admin', 'assetManager'), returnAsset);

module.exports = allocationRouter;
