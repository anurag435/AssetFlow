const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    asset: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Asset', 
      required: true 
    },
    bookedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department' 
    },
    startTime: { 
      type: Date, 
      required: true 
    },
    endTime: { 
      type: Date, 
      required: true 
    },
    purpose: { 
      type: String, 
      trim: true 
    },

    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ asset: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
