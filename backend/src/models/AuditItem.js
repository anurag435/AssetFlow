const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema(
  {
    auditCycle: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'AuditCycle', 
      required: true 
    },
    asset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      required: true 
    },

    result: {
      type: String,
      enum: ['Pending', 'Verified', 'Missing', 'Damaged'],
      default: 'Pending',
    },
    notes: { 
      type: String 
    },
    checkedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }, 
    checkedAt: { 
      type: Date 
    },
  },
  { timestamps: true }
);

// One result per asset per cycle
auditItemSchema.index({ auditCycle: 1, asset: 1 }, { unique: true });

module.exports = mongoose.model('AuditItem', auditItemSchema);
