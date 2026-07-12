const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema(
  {
    asset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      required: true 
    },
    currentAllocation: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Allocation', 
      required: true 
    },
    fromHolderUser: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    fromHolderDepartment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department', 
      default: null 
    },
    requestedByUser: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    toHolderDepartment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department', 
      default: null 
    },

    reason: { 
      type: String, 
      trim: true 
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected'],
      default: 'Requested',
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    decisionNotes: { 
      type: String 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
