const express = require('express');
const dashboardRouter = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

dashboardRouter.get('/', protect, getDashboardSummary);

module.exports = dashboardRouter;
