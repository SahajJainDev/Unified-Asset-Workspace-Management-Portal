const mongoose = require('mongoose');

const verificationCycleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  closedBy: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for quick lookup of active cycle
verificationCycleSchema.index({ status: 1 });

module.exports = mongoose.model('VerificationCycle', verificationCycleSchema);
