const mongoose = require("mongoose");

const LicenseSchema = new mongoose.Schema(
  {
    softwareName: {
      type: String,
      trim: true
    },
    version: {
      type: String,
      default: ""
    },
    invoiceNumber: {
      type: String,
      default: ""
    },
    addedBy: {
      type: String,
      default: ""
    },
    startDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    seatsLimit: {
      type: Number,
      default: 1
    },
    licenseKey: {
      type: String,
      default: ""
    },
    assignedSystem: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("License", LicenseSchema);
