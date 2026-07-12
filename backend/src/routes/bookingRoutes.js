const express = require('express');
const bookingRouter = express.Router();
const {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/auth');

bookingRouter.get('/', protect, listBookings);
bookingRouter.post('/', protect, createBooking); // any logged-in user can book a shared resource
bookingRouter.patch('/:id/cancel', protect, cancelBooking);
bookingRouter.patch('/:id/reschedule', protect, rescheduleBooking);

module.exports = bookingRouter;
