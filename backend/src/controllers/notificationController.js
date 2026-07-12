const Notification = require('../models/Notification');

// GET /api/notifications?read=&type=
exports.listNotifications = async (req, res) => {
  try {
    const { read, type } = req.query;
    const filter = { user: req.user._id };
    if (read !== undefined) filter.read = read === 'true';
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .populate('relatedAsset', 'assetTag name')
      .sort({ createdAt: -1 });

    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch notifications.', error: err.message });
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch unread count.', error: err.message });
  }
};

// PATCH /api/notifications/:id/read
exports.toggleRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });

    notification.read = !notification.read;
    await notification.save();

    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification.', error: err.message });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notifications.', error: err.message });
  }
};