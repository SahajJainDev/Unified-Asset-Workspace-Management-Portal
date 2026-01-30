const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  building: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  workstations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workstation'
  }],
  layout: {
    type: Object, // JSON object for layout configuration
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
floorSchema.index({ building: 1, level: 1 });
floorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Floor', floorSchema);
