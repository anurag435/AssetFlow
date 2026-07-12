const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    asset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      required: true 
    },
    raisedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    issueDescription: { 
      type: String, 
      required: true, 
      trim: true 
    },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'], 
      default: 'Medium' 
    },
    photoUrl: { 
      type: String 
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    }, 
    rejectionReason: { 
      type: String 
    },

    technician: { 
      type: String, 
      trim: true 
    }, 
    resolutionNotes: { 
      type: String 
    },
    resolvedDate: { 
      type: Date, 
      default: null 
    },
  },
  { timestamps: true }
);

maintenanceRequestSchema.index({ asset: 1, status: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
