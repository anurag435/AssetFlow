const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    customFields: [
      {
        key: { 
          type: String, 
          required: true 
        },
        label: { 
          type: String, 
          required: true 
        },
        type: { 
          type: String, 
          enum: ['text', 'number', 'date'], 
          default: 'text' 
        },
      },
    ],
    status: { 
      type: String, 
      enum: ['Active', 'Inactive'], 
      default: 'Active' 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
