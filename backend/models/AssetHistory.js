const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['CREATED', 'ASSIGNED', 'RELEASED', 'REASSIGNED', 'UPDATED', 'QUICK_LOG', 'DELETED'],
        required: true
    },
    eventDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    performedBy: {
        type: String,
        required: true
    },
    performedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient chronological retrieval per asset
assetHistorySchema.index({ assetId: 1, performedAt: -1 });

module.exports = mongoose.model('AssetHistory', assetHistorySchema);
