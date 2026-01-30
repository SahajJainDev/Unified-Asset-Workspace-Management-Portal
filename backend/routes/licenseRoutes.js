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

// CREATE License
router.post("/", licenseValidationRules, handleValidationErrors, async (req, res) => {
  try {
    const license = new License(req.body);
    const savedLicense = await license.save();
    res.status(201).json({ success: true, message: 'License created successfully', data: savedLicense });
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
    const updatedLicense = await License.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedLicense) return res.status(404).json({ message: "License not found" });
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
