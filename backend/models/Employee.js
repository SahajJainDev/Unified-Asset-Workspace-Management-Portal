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
  }
}, {
  timestamps: true
});

// Index for efficient queries
employeeSchema.index({ empId: 1 });
employeeSchema.index({ fullName: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
