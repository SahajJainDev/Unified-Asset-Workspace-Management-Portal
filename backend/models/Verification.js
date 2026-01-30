const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Flagged'],
    required: true
  },
  verifiedBy: {
    type: String,
    required: true
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
verificationSchema.index({ status: 1 });
verificationSchema.index({ assetId: 1 });
verificationSchema.index({ verificationDate: -1 });

module.exports = mongoose.model('Verification', verificationSchema);
