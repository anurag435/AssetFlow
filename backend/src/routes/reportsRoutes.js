const express = require('express');
const reportsRouter = express.Router();
const { getReportsSummary } = require('../controllers/reportsController');
const { protect } = require('../middlewares/auth');

reportsRouter.get('/summary', protect, getReportsSummary);

module.exports = reportsRouter;