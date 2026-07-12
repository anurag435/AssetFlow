const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');

const generateAssetTag = async () => {
  const count = await Asset.countDocuments();
  const nextNumber = count + 1;
  return `AF-${String(nextNumber).padStart(4, '0')}`;
};

// POST /api/assets 
exports.registerAsset = async (req, res) => {
  try {
    const {
      name,
      category,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      department,
      photoUrl,
      documents,
      isBookable,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required.' });
    }

    const assetTag = await generateAssetTag();

    const asset = await Asset.create({
      assetTag,
      name,
      category,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      department,
      photoUrl,
      documents,
      isBookable: !!isBookable,
      status: 'Available', // every new asset always enters as Available
    });
    await asset.save();

    return res.status(201).json(asset);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to register asset.', error: err.message });
  }
};

//support filter
exports.listAssets = async (req, res) => {
  try {
    const { q, category, status, department, location, isBookable, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { assetTag: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (isBookable !== undefined) filter.isBookable = isBookable === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .populate('category', 'name')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Asset.countDocuments(filter),
    ]);

    return res.json({ assets, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch assets.', error: err.message });
  }
};

// GET /api/assets/:id
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name')
      .populate('department', 'name code')
      .populate('currentAllocation');
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch asset.', error: err.message });
  }
};

// GET /api/assets/:id/history
exports.getAssetHistory = async (req, res) => {
  try {
    const assetId = req.params.id;

    const [allocations, maintenanceRecords] = await Promise.all([
      Allocation.find({ asset: assetId })
        .populate('holderUser', 'name email')
        .populate('holderDepartment', 'name code')
        .populate('allocatedBy', 'name')
        .sort({ allocatedDate: -1 }),
      MaintenanceRequest.find({ asset: assetId })
        .populate('raisedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ allocations, maintenanceRecords });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch asset history.', error: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const {
      name,
      category,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      department,
      photoUrl,
      documents,
      isBookable,
    } = req.body;

    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        serialNumber,
        acquisitionDate,
        acquisitionCost,
        condition,
        location,
        department,
        photoUrl,
        documents,
        isBookable,
      },
      { new: true, runValidators: true }
    );
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update asset.', error: err.message });
  }
};

// PATCH /api/assets/:id/retire (admin-only)
exports.retireAsset = async (req, res) => {
  try {
    const { targetStatus } = req.body; // 'Retired' or 'Disposed'
    if (!['Retired', 'Disposed'].includes(targetStatus)) {
      return res.status(400).json({ message: 'targetStatus must be Retired or Disposed.' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    if (asset.status === 'Allocated' || asset.status === 'Reserved') {
      return res.status(409).json({
        message: `Cannot retire an asset that is currently ${asset.status}. Return or release it first.`,
      });
    }

    asset.status = targetStatus;
    await asset.save();
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retire asset.', error: err.message });
  }
};
