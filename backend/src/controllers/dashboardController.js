const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const TransferRequest = require('../models/TransferRequest');

// GET /api/dashboard  (any logged-in user)
exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      assetsAvailable,
      assetsAllocated,
      assetsUnderMaintenance,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    ] = await Promise.all([
      Asset.countDocuments({ status: 'Available' }),
      Asset.countDocuments({ status: 'Allocated' }),
      Asset.countDocuments({ status: 'Under Maintenance' }),
      Booking.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } }),
      TransferRequest.countDocuments({ status: 'Requested' }),
      Allocation.countDocuments({
        status: 'Active',
        expectedReturnDate: { $gte: now, $lte: sevenDaysFromNow },
      }),
      Allocation.countDocuments({
        status: 'Active',
        expectedReturnDate: { $lt: now },
      }),
    ]);

    const kpis = [
      { label: 'Available', value: assetsAvailable },
      { label: 'Allocated', value: assetsAllocated },
      { label: 'Maintenance today', value: assetsUnderMaintenance },
      { label: 'Active bookings', value: activeBookings },
      { label: 'Pending transfers', value: pendingTransfers },
      { label: 'Upcoming returns', value: upcomingReturns },
    ];

    const [recentAllocations, recentBookings, recentMaintenance] = await Promise.all([
      Allocation.find({ status: 'Active' })
        .sort({ allocatedDate: -1 })
        .limit(3)
        .populate('asset', 'assetTag name')
        .populate('holderUser', 'name'),
      Booking.find({ status: { $in: ['Upcoming', 'Ongoing'] } })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('asset', 'assetTag name'),
      MaintenanceRequest.find({ status: { $in: ['Approved', 'Resolved'] } })
        .sort({ updatedAt: -1 })
        .limit(3)
        .populate('asset', 'assetTag name'),
    ]);

    const activityFeed = [
      ...recentAllocations.map((a) => ({
        timestamp: a.allocatedDate,
        message: `${a.asset?.name || 'Asset'} ${a.asset?.assetTag ? `(${a.asset.assetTag})` : ''} — allocated to ${a.holderUser?.name || 'department'}`,
      })),
      ...recentBookings.map((b) => ({
        timestamp: b.createdAt,
        message: `${b.asset?.name || 'Resource'} — booking ${b.status.toLowerCase()} (${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      })),
      ...recentMaintenance.map((m) => ({
        timestamp: m.updatedAt,
        message: `${m.asset?.name || 'Asset'} — maintenance ${m.status.toLowerCase()}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6)
      .map((item) => item.message);

    return res.json({
      kpis,
      overdueReturns,
      recentActivity: activityFeed,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load dashboard summary.', error: err.message });
  }
};