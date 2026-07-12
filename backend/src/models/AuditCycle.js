const mongoose = require('mongoose');

const auditCycleSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    }, 
    scopeDepartment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department', 
      default: null 
    },
    scopeLocation: { 
      type: String, 
      trim: true 
    },

    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },

    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    status: { 
      type: String, 
      enum: ['Draft', 'Active', 'Closed'], 
      default: 'Draft' 
    },
    closedAt: {
      type: Date, 
      default: null 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditCycle', auditCycleSchema);
