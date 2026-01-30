const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'description'
  },
  status: {
    type: String,
    default: 'Available'
  },
  color: {
    type: String,
    default: 'blue'
  },
  category: {
    type: String,
    enum: ['Audit', 'Compliance', 'Inventory', 'Usage', 'Maintenance'],
    default: 'Audit'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
ReportSchema.index({ category: 1 });
ReportSchema.index({ isActive: 1 });

module.exports = mongoose.model('Report', ReportSchema);
