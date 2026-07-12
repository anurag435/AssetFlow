const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    type: {
      type: String,
      enum: [
        'AssetAssigned',
        'MaintenanceApproved',
        'MaintenanceRejected',
        'BookingConfirmed',
        'BookingCancelled',
        'BookingReminder',
        'TransferApproved',
        'OverdueReturn',
        'AuditDiscrepancy',
      ],
      required: true,
    },
    message: { 
      type: String, 
      required: true 
    },
    relatedAsset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      default: null 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
