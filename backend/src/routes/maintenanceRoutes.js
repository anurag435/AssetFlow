const express = require('express');
const maintenanceRouter = express.Router();
const {
  raiseMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenanceWork,
  resolveMaintenanceRequest,
  listMaintenanceRequests,
} = require('../controllers/maintenanceController');
const { protect, requireRole } = require('../middlewares/auth');

maintenanceRouter.get('/', protect, listMaintenanceRequests);
maintenanceRouter.post('/', protect, raiseMaintenanceRequest); // any logged-in user (the asset holder)

maintenanceRouter.patch('/:id/approve', protect, requireRole('admin', 'assetManager'), approveMaintenanceRequest);
maintenanceRouter.patch('/:id/assign-technician', protect, requireRole('admin', 'assetManager'), assignTechnician);
maintenanceRouter.patch('/:id/resolve', protect, requireRole('admin', 'assetManager'), resolveMaintenanceRequest);

module.exports = maintenanceRouter;
