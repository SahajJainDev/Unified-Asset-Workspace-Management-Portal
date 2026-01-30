const mongoose = require('mongoose');

const workstationSchema = new mongoose.Schema({
  workstationId: {
    type: String,
    required: true,
    unique: false
  },
  seatNumber: {
    type: String,
    required: true
  },
  floorType: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]$/.test(v);
      },
      message: 'Floor Type must be a single uppercase letter (A-Z)'
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied'],
    default: 'Available'
  },
  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  assignedEmployeeId: {
    type: String,
    default: null
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
workstationSchema.index({ floor: 1 });
workstationSchema.index({ room: 1 });
workstationSchema.index({ status: 1 });
workstationSchema.index({ assignedEmployeeId: 1 });
workstationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Workstation', workstationSchema);
