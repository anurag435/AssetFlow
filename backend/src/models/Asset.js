const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetTag: { 
      type: String, 
      required: true, 
      unique: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'AssetCategory', 
      required: true 
    },
    serialNumber: { 
      type: String, 
      trim: true 
    },
    acquisitionDate: { 
      type: Date 
    },
    acquisitionCost: { 
      type: Number, 
      default: 0 
    }, 
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good',
    },
    location: { 
      type: String, 
      trim: true 
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department' 
    }, // current owning department (optional)
    photoUrl: { 
      type: String 
    },
    documents: [{ type: String }], // file URLs

    isBookable: { type: Boolean, default: false }, 

    status: {
      type: String,
      enum: [
        'Available',
        'Allocated',
        'Reserved',
        'Under Maintenance',
        'Lost',
        'Retired',
        'Disposed',
      ],
      default: 'Available',
    },

    currentAllocation: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Allocation', 
      default: null 
    },
  },
  { timestamps: true }
);

assetSchema.index({ category: 1, status: 1, department: 1 });

module.exports = mongoose.model('Asset', assetSchema);
