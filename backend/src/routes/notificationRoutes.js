const express = require('express');
const notificationRouter = express.Router();
const {
  listNotifications,
  getUnreadCount,
  toggleRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

notificationRouter.get('/', protect, listNotifications);
notificationRouter.get('/unread-count', protect, getUnreadCount);
notificationRouter.patch('/read-all', protect, markAllRead);
notificationRouter.patch('/:id/read', protect, toggleRead);

module.exports = notificationRouter;
