const Asset = require('../models/Asset');
const MaintenanceRequest = require('../models/MaintenanceRequest');

// POST /api/maintenance  (any logged-in user — the asset holder raises the issue)
exports.raiseMaintenanceRequest = async (req, res) => {
  try {
    const { assetId, issueDescription, priority, photoUrl } = req.body;

    if (!assetId || !issueDescription) {
      return res.status(400).json({ message: 'assetId and issueDescription are required.' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    if (['Retired', 'Disposed', 'Lost'].includes(asset.status)) {
      return res.status(409).json({ message: `Cannot raise maintenance for a ${asset.status} asset.` });
    }

    const request = await MaintenanceRequest.create({
      asset: assetId,
      raisedBy: req.user._id,
      issueDescription,
      priority: priority || 'Medium',
      photoUrl,
      status: 'Pending',
    });

    return res.status(201).json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to raise maintenance request.', error: err.message });
  }
};

// PATCH /api/maintenance/:id/approve  (Asset Manager / Admin)
exports.approveMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found.' });
    if (request.status !== 'Pending') {
      return res.status(409).json({ message: `Request is already ${request.status}.` });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    await request.save();

    await Asset.findByIdAndUpdate(request.asset, { status: 'Under Maintenance' });

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve request.', error: err.message });
  }
};

// PATCH /api/maintenance/:id/reject  (Asset Manager / Admin)
exports.rejectMaintenanceRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found.' });
    if (request.status !== 'Pending') {
      return res.status(409).json({ message: `Request is already ${request.status}.` });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.rejectionReason = rejectionReason;
    await request.save();

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject request.', error: err.message });
  }
};

// PATCH /api/maintenance/:id/assign-technician  (Asset Manager / Admin)
exports.assignTechnician = async (req, res) => {
  try {
    const { technician } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found.' });
    if (request.status !== 'Approved') {
      return res.status(409).json({ message: 'Request must be Approved before assigning a technician.' });
    }

    request.status = 'Technician Assigned';
    request.technician = technician;
    await request.save();

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to assign technician.', error: err.message });
  }
};

// PATCH /api/maintenance/:id/start  (Asset Manager / Admin / Technician)
exports.startMaintenanceWork = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found.' });
    if (request.status !== 'Technician Assigned') {
      return res.status(409).json({ message: 'A technician must be assigned before work can start.' });
    }

    request.status = 'In Progress';
    await request.save();

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update request.', error: err.message });
  }
};

// PATCH /api/maintenance/:id/resolve  (Asset Manager / Admin)
exports.resolveMaintenanceRequest = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found.' });
    if (request.status !== 'In Progress') {
      return res.status(409).json({ message: 'Request must be In Progress before it can be resolved.' });
    }

    request.status = 'Resolved';
    request.resolutionNotes = resolutionNotes;
    request.resolvedDate = new Date();
    await request.save();

    const asset = await Asset.findById(request.asset);
    if (asset && asset.status !== 'Retired') {
      asset.status = 'Available';
      await asset.save();
    }

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve request.', error: err.message });
  }
};

// GET /api/maintenance?status=Pending&assetId=...
exports.listMaintenanceRequests = async (req, res) => {
  try {
    const { status, assetId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assetId) filter.asset = assetId;

    const requests = await MaintenanceRequest.find(filter)
      .populate('asset', 'assetTag name')
      .populate('raisedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch maintenance requests.', error: err.message });
  }
};
