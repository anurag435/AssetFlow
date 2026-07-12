const Asset = require('../models/Asset');
const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');

// POST /api/audits  (Admin only)
// Creates the cycle AND auto-generates one AuditItem per matching asset in scope.
exports.createAuditCycle = async (req, res) => {
  try {
    const { name, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'name, startDate and endDate are required.' });
    }

    const cycle = await AuditCycle.create({
      name,
      scopeDepartment: scopeDepartment || null,
      scopeLocation,
      startDate,
      endDate,
      auditors: auditors || [],
      status: 'Draft',
    });

    // Build the scope filter for which assets belong in this audit
    const assetFilter = {};
    if (scopeDepartment) assetFilter.department = scopeDepartment;
    if (scopeLocation) assetFilter.location = { $regex: scopeLocation, $options: 'i' };
    // Don't bother auditing assets that are already retired/disposed
    assetFilter.status = { $nin: ['Retired', 'Disposed'] };

    const assetsInScope = await Asset.find(assetFilter).select('_id');

    const auditItems = await AuditItem.insertMany(
      assetsInScope.map((asset) => ({
        auditCycle: cycle._id,
        asset: asset._id,
        result: 'Pending',
      }))
    );

    return res.status(201).json({ cycle, itemCount: auditItems.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create audit cycle.', error: err.message });
  }
};

// PATCH /api/audits/:id/activate  (Admin only) — moves Draft -> Active so auditors can start logging
exports.activateAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found.' });
    if (cycle.status !== 'Draft') {
      return res.status(409).json({ message: `Cycle is already ${cycle.status}.` });
    }

    cycle.status = 'Active';
    await cycle.save();
    return res.json(cycle);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to activate cycle.', error: err.message });
  }
};

// GET /api/audits/:id/items  — the checklist an auditor works through
exports.listAuditItems = async (req, res) => {
  try {
    const { result } = req.query;
    const filter = { auditCycle: req.params.id };
    if (result) filter.result = result;

    const items = await AuditItem.find(filter)
      .populate('asset', 'assetTag name location status')
      .populate('checkedBy', 'name');

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch audit items.', error: err.message });
  }
};

// PATCH /api/audits/items/:itemId  (assigned auditor only)
// Auditor marks a single asset as Verified / Missing / Damaged.
exports.recordAuditResult = async (req, res) => {
  try {
    const { result, notes } = req.body;
    if (!['Verified', 'Missing', 'Damaged'].includes(result)) {
      return res.status(400).json({ message: 'result must be Verified, Missing, or Damaged.' });
    }

    const item = await AuditItem.findById(req.params.itemId).populate('auditCycle');
    if (!item) return res.status(404).json({ message: 'Audit item not found.' });

    if (item.auditCycle.status !== 'Active') {
      return res.status(409).json({ message: 'This audit cycle is not Active.' });
    }

    // Only an assigned auditor (or admin) can log a result
    const isAssignedAuditor = item.auditCycle.auditors.some(
      (auditorId) => auditorId.toString() === req.user._id.toString()
    );
    if (!isAssignedAuditor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not an assigned auditor for this cycle.' });
    }

    item.result = result;
    item.notes = notes;
    item.checkedBy = req.user._id;
    item.checkedAt = new Date();
    await item.save();

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to record audit result.', error: err.message });
  }
};

// GET /api/audits/:id/discrepancy-report
// Auto-generated report: everything flagged Missing or Damaged in this cycle.
exports.getDiscrepancyReport = async (req, res) => {
  try {
    const discrepancies = await AuditItem.find({
      auditCycle: req.params.id,
      result: { $in: ['Missing', 'Damaged'] },
    })
      .populate('asset', 'assetTag name location category')
      .populate('checkedBy', 'name');

    return res.json({
      cycleId: req.params.id,
      discrepancyCount: discrepancies.length,
      discrepancies,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate discrepancy report.', error: err.message });
  }
};

// PATCH /api/audits/:id/close  (Admin only)
// Locks the cycle and pushes real status updates: confirmed-Missing assets become Lost.
// Damaged assets keep their current status but their `condition` field is updated.
exports.closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found.' });
    if (cycle.status === 'Closed') {
      return res.status(409).json({ message: 'This cycle is already closed.' });
    }

    const missingItems = await AuditItem.find({ auditCycle: cycle._id, result: 'Missing' });
    const damagedItems = await AuditItem.find({ auditCycle: cycle._id, result: 'Damaged' });

    await Asset.updateMany(
      { _id: { $in: missingItems.map((i) => i.asset) } },
      { status: 'Lost' }
    );
    await Asset.updateMany(
      { _id: { $in: damagedItems.map((i) => i.asset) } },
      { condition: 'Damaged' }
    );

    cycle.status = 'Closed';
    cycle.closedAt = new Date();
    await cycle.save();

    return res.json({
      cycle,
      assetsMarkedLost: missingItems.length,
      assetsMarkedDamaged: damagedItems.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to close audit cycle.', error: err.message });
  }
};

// GET /api/audits
exports.listAuditCycles = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const cycles = await AuditCycle.find(filter)
      .populate('scopeDepartment', 'name code')
      .populate('auditors', 'name email')
      .sort({ createdAt: -1 });

    return res.json(cycles);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch audit cycles.', error: err.message });
  }
};
