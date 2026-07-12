const express = require('express');
const transferRouter = express.Router();
const {
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  listTransfers,
} = require('../controllers/allocationController');
const { protect, requireRole } = require('../middlewares/auth');

transferRouter.get('/', protect, listTransfers);
transferRouter.post('/', protect, requestTransfer); // any logged-in employee can request
transferRouter.patch('/:id/approve', protect, requireRole('admin', 'assetManager', 'departmentHead'), approveTransfer);
transferRouter.patch('/:id/reject', protect, requireRole('admin', 'assetManager', 'departmentHead'), rejectTransfer);

module.exports = transferRouter;
