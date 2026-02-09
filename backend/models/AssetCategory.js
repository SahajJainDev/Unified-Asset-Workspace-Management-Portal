const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'devices',
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

assetCategorySchema.index({ name: 1 });
assetCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
