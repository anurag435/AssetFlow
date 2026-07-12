const express = require('express');
const auditRouter = express.Router();
const {
  createAuditCycle,
  activateAuditCycle,
  listAuditItems,
  recordAuditResult,
  getDiscrepancyReport,
  closeAuditCycle,
  listAuditCycles,
} = require('../controllers/auditController');
const { protect, requireRole } = require('../middlewares/auth');

auditRouter.get('/', protect, listAuditCycles);
auditRouter.post('/', protect, requireRole('admin'), createAuditCycle);
auditRouter.patch('/:id/activate', protect, requireRole('admin'), activateAuditCycle);
auditRouter.get('/:id/items', protect, listAuditItems);
auditRouter.get('/:id/discrepancy-report', protect, getDiscrepancyReport);
auditRouter.patch('/:id/close', protect, requireRole('admin'), closeAuditCycle);
auditRouter.patch('/items/:itemId', protect, recordAuditResult);

module.exports = auditRouter;
