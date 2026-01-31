const express = require("express");
const { body, validationResult } = require('express-validator');
const License = require("../models/License");

const router = express.Router();

// Validation rules
const licenseValidationRules = [
  body('softwareName').optional().trim().isLength({ min: 1 }).withMessage('Software name cannot be empty if provided'),
  body('version').optional().isLength({ min: 1 }).withMessage('Version cannot be empty if provided'),
  body('invoiceNumber').optional().isLength({ min: 1 }).withMessage('Invoice number cannot be empty if provided'),
  body('addedBy').optional().isLength({ min: 1 }).withMessage('Added by cannot be empty if provided'),
  body('startDate').optional(),
  body('expiryDate').optional(),
  body('seatsLimit').optional().isInt({ min: 1 }).withMessage('Seats limit must be a positive integer'),
  body('licenseKey').optional().isLength({ min: 1 }).withMessage('License key cannot be empty if provided'),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const Software = require("../models/Software"); // Import Software model

// CREATE License
router.post("/", licenseValidationRules, handleValidationErrors, async (req, res) => {
  try {
    const license = new License(req.body);
    const savedLicense = await license.save();

    // Aggregate into Software collection
    const softwareName = req.body.softwareName;
    const seatsToAdd = req.body.seatsLimit || 1;

    // Check if software exists
    let software = await Software.findOne({ name: softwareName });

    if (software) {
      // Update existing software
      software.totalSeats += seatsToAdd;
      // Recalculate utilization? (usedSeats remains same, utilization % changes)
      if (software.totalSeats > 0) {
        software.utilizationPercentage = Math.round((software.usedSeats / software.totalSeats) * 100);
      }
      await software.save();
    } else {
      // Create new software entry
      software = new Software({
        name: softwareName,
        version: req.body.version || 'Web-based',
        totalSeats: seatsToAdd,
        usedSeats: 0,
        utilizationPercentage: 0,
        status: 'Active',
        statusColor: 'green',
        icon: 'extension' // Default icon
      });
      await software.save();
    }

    res.status(201).json({ success: true, message: 'License created successfully and software updated', data: savedLicense });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'License key must be unique' });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
});

// GET All Licenses
router.get("/", async (req, res) => {
  try {
    const licenses = await License.find();
    res.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ message: 'Failed to fetch licenses' });
  }
});

// GET License by ID
router.get("/:id", async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) return res.status(404).json({ message: "License not found" });
    res.json(license);
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid license ID format' });
    } else {
      console.error('Error fetching license:', error);
      res.status(500).json({ message: 'Failed to fetch license' });
    }
  }
});

// UPDATE License
router.put("/:id", licenseValidationRules, handleValidationErrors, async (req, res) => {
  try {
    const oldLicense = await License.findById(req.params.id);
    if (!oldLicense) return res.status(404).json({ message: "License not found" });

    const updatedLicense = await License.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If seatsLimit changed, update Software aggregation
    if (req.body.seatsLimit !== undefined && req.body.seatsLimit !== oldLicense.seatsLimit) {
      const softwareName = updatedLicense.softwareName;
      const seatsDiff = (req.body.seatsLimit || 0) - (oldLicense.seatsLimit || 0);

      const software = await Software.findOne({ name: softwareName });
      if (software) {
        software.totalSeats += seatsDiff;
        if (software.totalSeats > 0) {
          software.utilizationPercentage = Math.round((software.usedSeats / software.totalSeats) * 100);
        }
        await software.save();
      }
    }

    res.json(updatedLicense);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'License key must be unique' });
    } else if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid license ID format' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// DELETE License
router.delete("/:id", async (req, res) => {
  try {
    const deletedLicense = await License.findByIdAndDelete(req.params.id);
    if (!deletedLicense) return res.status(404).json({ message: "License not found" });
    res.json({ message: "License deleted successfully" });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid license ID format' });
    } else {
      console.error('Error deleting license:', error);
      res.status(500).json({ message: 'Failed to delete license' });
    }
  }
});

module.exports = router;
