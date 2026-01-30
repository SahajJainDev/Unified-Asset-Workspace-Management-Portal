const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['asset', 'license', 'maintenance', 'reservation', 'policy', 'other'],
    default: 'other'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ timestamp: -1 });
activitySchema.index({ category: 1 });

module.exports = mongoose.model('Activity', activitySchema);
