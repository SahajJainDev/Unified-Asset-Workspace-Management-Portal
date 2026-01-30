const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Office', 'Conference', 'Break Room', 'Storage', 'Open Space'],
    default: 'Office'
  },
  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true
  },
  capacity: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  workstations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workstation'
  }],
  amenities: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ floor: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);
