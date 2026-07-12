const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    asset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      required: true 
    },
    holderUser: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    holderDepartment: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', 
      default: null 
    },
    allocatedDate: { 
      type: Date, 
      default: Date.now 
    },
    expectedReturnDate: { 
      type: Date 
    },
    actualReturnDate: { 
      type: Date, 
      default: null 
    },
    conditionAtAllocation: { 
      type: String 
    },
    conditionAtReturn: { 
      type: String 
    },
    returnNotes: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: ['Active', 'Returned'], 
      default: 'Active' 
    },

    allocatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  },
  { timestamps: true }
);

allocationSchema.index({ asset: 1, status: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);
