const express = require('express');
const assetRouter = express.Router();
const {
  registerAsset,
  listAssets,
  getAssetById,
  getAssetHistory,
  updateAsset,
  retireAsset,
} = require('../controllers/assetController');
const { protect, requireRole } = require('../middleware/auth');

assetRouter.get('/', protect, listAssets); // all logged-in roles can search/browse
assetRouter.get('/:id', protect, getAssetById);
assetRouter.get('/:id/history', protect, getAssetHistory);

assetRouter.post('/', protect, requireRole('admin', 'assetManager'), registerAsset);
assetRouter.put('/:id', protect, requireRole('admin', 'assetManager'), updateAsset);
assetRouter.patch('/:id/retire', protect, requireRole('admin'), retireAsset);

module.exports = assetRouter;
