const mongoose = require('mongoose');

const SoftwareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    trim: true,
    default: 'Web-based'
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 0
  },
  usedSeats: {
    type: Number,
    required: true,
    min: 0
  },
  utilizationPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Active', 'Expiring Soon', 'Outdated', 'Limit Reached'],
    default: 'Active'
  },
  statusColor: {
    type: String,
    enum: ['green', 'amber', 'red'],
    default: 'green'
  },
  icon: {
    type: String,
    default: 'category'
  }
}, {
  timestamps: true
});

// Virtual for utilization string (e.g., "420/500")
SoftwareSchema.virtual('utilization').get(function() {
  return `${this.usedSeats}/${this.totalSeats}`;
});

// Virtual for percentage string (e.g., "84%")
SoftwareSchema.virtual('percentage').get(function() {
  return `${this.utilizationPercentage}%`;
});

// Ensure virtual fields are serialized
SoftwareSchema.set('toJSON', { virtuals: true });
SoftwareSchema.set('toObject', { virtuals: true });

// Indexes for performance
SoftwareSchema.index({ name: 1 });
SoftwareSchema.index({ status: 1 });

module.exports = mongoose.model('Software', SoftwareSchema);
