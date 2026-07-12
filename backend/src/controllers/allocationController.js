const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const TransferRequest = require('../models/TransferRequest');

// POST /api/allocations  (Asset Manager / Admin)
exports.allocateAsset = async (req, res) => {
  try {
    const { assetId, holderUser, holderDepartment, expectedReturnDate } = req.body;

    if (!assetId || (!holderUser && !holderDepartment)) {
      return res.status(400).json({
        message: 'assetId and either holderUser or holderDepartment are required.',
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    if (asset.status !== 'Available') {
      if (asset.status === 'Allocated') {
        const activeAllocation = await Allocation.findOne({ asset: assetId, status: 'Active' })
          .populate('holderUser', 'name email')
          .populate('holderDepartment', 'name code');

        return res.status(409).json({
          message: `This asset is currently held by ${
            activeAllocation?.holderUser?.name || activeAllocation?.holderDepartment?.name || 'someone else'
          }.`,
          currentAllocationId: activeAllocation?._id,
          suggestion: 'Use POST /api/transfers to request a transfer instead.',
        });
      }

      return res.status(409).json({
        message: `Asset is currently "${asset.status}" and cannot be allocated.`,
      });
    }

    const allocation = await Allocation.create({
      asset: assetId,
      holderUser: holderUser || null,
      holderDepartment: holderDepartment || null,
      expectedReturnDate,
      conditionAtAllocation: asset.condition,
      allocatedBy: req.user._id,
      status: 'Active',
    });

    asset.status = 'Allocated';
    asset.currentAllocation = allocation._id;
    await asset.save();

    return res.status(201).json(allocation);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to allocate asset.', error: err.message });
  }
};

// POST /api/allocations/:id/return  (Asset Manager / Admin)
exports.returnAsset = async (req, res) => {
  try {
    const { conditionAtReturn, returnNotes } = req.body;

    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: 'Allocation not found.' });
    if (allocation.status === 'Returned') {
      return res.status(409).json({ message: 'This allocation has already been returned.' });
    }

    allocation.status = 'Returned';
    allocation.actualReturnDate = new Date();
    allocation.conditionAtReturn = conditionAtReturn;
    allocation.returnNotes = returnNotes;
    await allocation.save();

    const asset = await Asset.findById(allocation.asset);
    if (asset) {
      asset.status = 'Available';
      asset.currentAllocation = null;
      if (conditionAtReturn) asset.condition = conditionAtReturn;
      await asset.save();
    }

    return res.json(allocation);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to process return.', error: err.message });
  }
};

// GET /api/allocations?status=Active&overdue=true
exports.listAllocations = async (req, res) => {
  try {
    const { status, overdue } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (overdue === 'true') {
      filter.status = 'Active';
      filter.expectedReturnDate = { $lt: new Date() };
    }

    const allocations = await Allocation.find(filter)
      .populate('asset', 'assetTag name')
      .populate('holderUser', 'name email')
      .populate('holderDepartment', 'name code')
      .populate('allocatedBy', 'name')
      .sort({ allocatedDate: -1 });

    return res.json(allocations);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch allocations.', error: err.message });
  }
};

// ---------------------------------------------------------------------------
// TRANSFER WORKFLOW: Requested → Approved (by Asset Manager/Dept Head) → Re-allocated
// ---------------------------------------------------------------------------

// POST /api/transfers  (any logged-in user, e.g. Raj requesting Priya's laptop)
exports.requestTransfer = async (req, res) => {
  try {
    const { assetId, toHolderDepartment, reason } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    const activeAllocation = await Allocation.findOne({ asset: assetId, status: 'Active' });
    if (!activeAllocation) {
      return res.status(400).json({ message: 'This asset has no active allocation to transfer.' });
    }

    const transfer = await TransferRequest.create({
      asset: assetId,
      currentAllocation: activeAllocation._id,
      fromHolderUser: activeAllocation.holderUser,
      fromHolderDepartment: activeAllocation.holderDepartment,
      requestedByUser: req.user._id,
      toHolderDepartment,
      reason,
      status: 'Requested',
    });

    return res.status(201).json(transfer);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request transfer.', error: err.message });
  }
};

// PATCH /api/transfers/:id/approve  (Asset Manager / Department Head)
exports.approveTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found.' });
    if (transfer.status !== 'Requested') {
      return res.status(409).json({ message: `Transfer is already ${transfer.status}.` });
    }

    // Close out the old allocation
    const oldAllocation = await Allocation.findById(transfer.currentAllocation);
    if (oldAllocation && oldAllocation.status === 'Active') {
      oldAllocation.status = 'Returned';
      oldAllocation.actualReturnDate = new Date();
      oldAllocation.returnNotes = 'Returned via transfer approval.';
      await oldAllocation.save();
    }

    // Open a new allocation for the requester
    const newAllocation = await Allocation.create({
      asset: transfer.asset,
      holderUser: transfer.requestedByUser,
      holderDepartment: transfer.toHolderDepartment || null,
      conditionAtAllocation: oldAllocation?.conditionAtReturn,
      allocatedBy: req.user._id,
      status: 'Active',
    });

    transfer.status = 'Approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    // Asset stays "Allocated" throughout — just points to the new allocation now
    await Asset.findByIdAndUpdate(transfer.asset, { currentAllocation: newAllocation._id });

    return res.json({ transfer, newAllocation });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve transfer.', error: err.message });
  }
};

// PATCH /api/transfers/:id/reject  (Asset Manager / Department Head)
exports.rejectTransfer = async (req, res) => {
  try {
    const { decisionNotes } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found.' });
    if (transfer.status !== 'Requested') {
      return res.status(409).json({ message: `Transfer is already ${transfer.status}.` });
    }

    transfer.status = 'Rejected';
    transfer.approvedBy = req.user._id;
    transfer.decisionNotes = decisionNotes;
    await transfer.save();

    return res.json(transfer);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject transfer.', error: err.message });
  }
};

// GET /api/transfers
exports.listTransfers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const transfers = await TransferRequest.find(filter)
      .populate('asset', 'assetTag name')
      .populate('requestedByUser', 'name email')
      .populate('fromHolderUser', 'name email')
      .sort({ createdAt: -1 });

    return res.json(transfers);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch transfers.', error: err.message });
  }
};