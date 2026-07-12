const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');

// GET /api/reports/summary
exports.getReportsSummary = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(now.getFullYear() - 3);

    // --- Utilization by department: % of that dept's assets currently Allocated
    const utilizationByDept = await Asset.aggregate([
      { $match: { department: { $ne: null } } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          allocated: { $sum: { $cond: [{ $eq: ['$status', 'Allocated'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      {
        $project: {
          _id: 0,
          dept: '$dept.name',
          value: { $round: [{ $multiply: [{ $divide: ['$allocated', '$total'] }, 100] }, 0] },
        },
      },
      { $sort: { dept: 1 } },
    ]);

    // --- Maintenance trend: request count per ISO week, last 8 weeks
    const trendAgg = await MaintenanceRequest.aggregate([
      { $match: { createdAt: { $gte: eightWeeksAgo } } },
      { $group: { _id: { $isoWeek: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const maintenanceTrend = trendAgg.map((t) => t.count);

    // --- Most used assets: bookings + allocations in the last 90 days, top 5
    const [bookingUsage, allocationUsage] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: ninetyDaysAgo } } },
        { $group: { _id: '$asset', count: { $sum: 1 } } },
      ]),
      Allocation.aggregate([
        { $match: { allocatedDate: { $gte: ninetyDaysAgo } } },
        { $group: { _id: '$asset', count: { $sum: 1 } } },
      ]),
    ]);
    const usageMap = new Map();
    for (const { _id, count } of [...bookingUsage, ...allocationUsage]) {
      const key = _id.toString();
      usageMap.set(key, (usageMap.get(key) || 0) + count);
    }
    const topAssetIds = [...usageMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topAssets = await Asset.find({ _id: { $in: topAssetIds.map(([id]) => id) } }).select('assetTag name');
    const mostUsedAssets = topAssetIds.map(([id, count]) => {
      const asset = topAssets.find((a) => a._id.toString() === id);
      return { label: asset ? `${asset.name} (${asset.assetTag})` : 'Unknown asset', uses: count };
    });

    // --- Idle assets: status Available, no allocation or booking in the last 30 days
    const [recentAllocAssetIds, recentBookingAssetIds] = await Promise.all([
      Allocation.find({ allocatedDate: { $gte: thirtyDaysAgo } }).distinct('asset'),
      Booking.find({ startTime: { $gte: thirtyDaysAgo } }).distinct('asset'),
    ]);
    const recentlyUsed = new Set([...recentAllocAssetIds, ...recentBookingAssetIds].map(String));
    const availableAssets = await Asset.find({ status: 'Available' }).select('assetTag name updatedAt');
    const idleAssets = availableAssets
      .filter((a) => !recentlyUsed.has(a._id.toString()))
      .slice(0, 8)
      .map((a) => {
        const idleDays = Math.floor((now - a.updatedAt) / (24 * 60 * 60 * 1000));
        return { label: `${a.name} (${a.assetTag})`, idleDays };
      });

    // --- Attention items: active maintenance + assets 3+ years old (retirement heuristic —
    // schema has no "next service due" field, so this can't be a precise due-date countdown)
    const activeMaintenance = await MaintenanceRequest.find({
      status: { $in: ['Approved', 'Technician Assigned', 'In Progress'] },
    })
      .populate('asset', 'assetTag name')
      .limit(5);
    const nearingRetirement = await Asset.find({
      acquisitionDate: { $lte: threeYearsAgo },
      status: { $nin: ['Retired', 'Disposed', 'Lost'] },
    })
      .select('assetTag name acquisitionDate')
      .limit(5);

    const attentionItems = [
      ...activeMaintenance.map((m) => `${m.asset?.name || 'Asset'} (${m.asset?.assetTag}) — maintenance ${m.status.toLowerCase()}`),
      ...nearingRetirement.map((a) => {
        const years = ((now - a.acquisitionDate) / (365 * 24 * 60 * 60 * 1000)).toFixed(1);
        return `${a.name} (${a.assetTag}) — ${years} years old, nearing retirement`;
      }),
    ];

    return res.json({ utilizationByDept, maintenanceTrend, mostUsedAssets, idleAssets, attentionItems });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate reports summary.', error: err.message });
  }
};