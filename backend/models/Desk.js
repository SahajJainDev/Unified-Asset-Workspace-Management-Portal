const mongoose = require('mongoose');

const deskSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Occupied', 'Available', 'Reserved'],
    required: true
  },
  deskId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
deskSchema.index({ status: 1 });
deskSchema.index({ location: 1 });

module.exports = mongoose.model('Desk', deskSchema);
