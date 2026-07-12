const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true 
    },
    head: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    parentDepartment: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', 
      default: null 
    },
    status: { 
      type: String,
      enum: ['Active', 'Inactive'], 
      default: 'Active' 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
