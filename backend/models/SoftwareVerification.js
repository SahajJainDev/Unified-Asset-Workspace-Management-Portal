const mongoose = require('mongoose');

const InstalledSoftwareSchema = new mongoose.Schema({
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoftwareVerification',
    required: true
  },
  softwareName: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  installDate: {
    type: String,
    trim: true
  },
  installLocation: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: 'UserRegistry'
  }
}, {
  timestamps: true
});

const SoftwareVerificationSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  assetId: {
    type: String,
    required: true,
    trim: true
  },
  systemInfo: {
    computerName: String,
    userName: String,
    domain: String,
    ipAddress: String,
    osVersion: String,
    osBuildNumber: String,
    osArchitecture: String,
    serialNumber: String,
    manufacturer: String,
    model: String,
    totalRAM: Number,
    processor: String,
    adminRights: String,
    encryptionStatus: String,
    vpnSoftware: String,
    antivirus: String,
    usbStorageAccess: String,
    scanDate: Date
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  softwareCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
SoftwareVerificationSchema.index({ employeeId: 1 });
SoftwareVerificationSchema.index({ assetId: 1 });
SoftwareVerificationSchema.index({ scannedAt: -1 });

InstalledSoftwareSchema.index({ verificationId: 1 });
InstalledSoftwareSchema.index({ softwareName: 1 });

const SoftwareVerification = mongoose.model('SoftwareVerification', SoftwareVerificationSchema);
const InstalledSoftware = mongoose.model('InstalledSoftware', InstalledSoftwareSchema);

module.exports = {
  SoftwareVerification,
  InstalledSoftware
};
