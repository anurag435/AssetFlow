const Asset = require('../models/Asset');
const Booking = require('../models/Booking');

// POST /api/bookings  (any logged-in user)
// Books a shared/bookable resource for a time slot, rejecting any overlap.
exports.createBooking = async (req, res) => {
  try {
    const { assetId, startTime, endTime, purpose, department } = req.body;

    if (!assetId || !startTime || !endTime) {
      return res.status(400).json({ message: 'assetId, startTime and endTime are required.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'endTime must be after startTime.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    if (!asset.isBookable) {
      return res.status(400).json({ message: 'This asset is not marked as a bookable resource.' });
    }
    if (['Lost', 'Retired', 'Disposed'].includes(asset.status)) {
      return res.status(409).json({ message: `Asset is ${asset.status} and cannot be booked.` });
    }

    // THE CORE RULE: find any non-cancelled booking for this asset whose time range
    // overlaps with the requested range. Overlap formula: newStart < existingEnd AND newEnd > existingStart
    const conflictingBooking = await Booking.findOne({
      asset: assetId,
      status: { $in: ['Upcoming', 'Ongoing'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message: `This resource is already booked from ${conflictingBooking.startTime.toISOString()} to ${conflictingBooking.endTime.toISOString()}.`,
        conflictingBookingId: conflictingBooking._id,
      });
    }

    const booking = await Booking.create({
      asset: assetId,
      bookedBy: req.user._id,
      department: department || req.user.department,
      startTime: start,
      endTime: end,
      purpose,
      status: 'Upcoming',
    });

    return res.status(201).json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create booking.', error: err.message });
  }
};

// GET /api/bookings?assetId=...&status=...
// Calendar view: list bookings for a resource (or all), optionally filtered by status
exports.listBookings = async (req, res) => {
  try {
    const { assetId, status } = req.query;
    const filter = {};
    if (assetId) filter.asset = assetId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('asset', 'assetTag name')
      .populate('bookedBy', 'name email')
      .populate('department', 'name code')
      .sort({ startTime: 1 });

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch bookings.', error: err.message });
  }
};

// PATCH /api/bookings/:id/cancel  (the person who booked it, or Admin/Asset Manager)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isManager = ['admin', 'assetManager'].includes(req.user.role);
    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(409).json({ message: `Booking is already ${booking.status}.` });
    }

    booking.status = 'Cancelled';
    await booking.save();

    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel booking.', error: err.message });
  }
};

// PATCH /api/bookings/:id/reschedule  (owner or Admin/Asset Manager)
// Just cancels the old slot and re-runs the same overlap check for the new one.
exports.rescheduleBooking = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'endTime must be after startTime.' });
    }

    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id }, // exclude itself
      asset: booking.asset,
      status: { $in: ['Upcoming', 'Ongoing'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'The new time slot overlaps with an existing booking.' });
    }

    booking.startTime = start;
    booking.endTime = end;
    await booking.save();

    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reschedule booking.', error: err.message });
  }
};
