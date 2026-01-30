const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  assetType: {
    type: String,
    enum: ['Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Smartphone', 'Tablet', 'Other'],
    default: 'Laptop'
  },
  model: {
    type: String,
    trim: true
  },
  make: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  assetTag: {
    type: String,
    unique: true,
    trim: true
  },
  assignedTo: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  vendorName: {
    type: String,
    trim: true
  },
  purchaseOrderNumber: {
    type: String,
    trim: true
  },
  addedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['IN USE', 'STORAGE', 'REPAIR', 'Available', 'Assigned', 'Not Available', 'Damaged'],
    default: 'STORAGE'
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Good'
  },
  reasonNotAvailable: {
    type: String,
    trim: true
  },
  assignmentDate: {
    type: Date
  },
  employee: {
    number: { type: String, trim: true },
    name: { type: String, trim: true },
    department: { type: String, trim: true },
    subDepartment: { type: String, trim: true }
  },
  description: {
    type: String,
    trim: true
  },
  specs: {
    processor: { type: String, trim: true },
    memory: { type: String, trim: true },
    storage: { type: String, trim: true },
    batteryHealth: { type: String, trim: true }
  }
}, {
  timestamps: true
});

// Indexes for performance
AssetSchema.index({ assetTag: 1 });
AssetSchema.index({ status: 1 });
AssetSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Asset', AssetSchema);
