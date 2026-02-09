const mongoose = require('mongoose');

const deskSchema = new mongoose.Schema({
  workstationId: {
    type: String,
    required: true,
    unique: true
  },
  block: {
    type: String,
    required: true,
    default: 'A'
  },
  empId: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  project: {
    type: String,
    default: ''
  },
  manager: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Permanently Assigned'],
    default: 'Available'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
deskSchema.index({ block: 1 });
deskSchema.index({ status: 1 });
deskSchema.index({ workstationId: 1 });

module.exports = mongoose.model('Desk', deskSchema);
