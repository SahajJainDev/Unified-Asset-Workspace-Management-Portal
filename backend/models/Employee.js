const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  subDepartment: {
    type: String,
    trim: true,
    default: ''
  },
  mobile: {
    type: String,
    trim: true,
    default: ''
  },
  workstationId: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['Admin', 'Employee'],
    default: 'Employee'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
employeeSchema.index({ empId: 1 });
employeeSchema.index({ fullName: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
