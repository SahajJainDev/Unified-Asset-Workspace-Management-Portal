const express = require("express");
const router = express.Router();
const Software = require("../models/Software");
const License = require("../models/License"); // Import License model
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// BULK UPLOAD Software & Licenses
router.post("/bulk-upload", upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const results = {
    insertedCount: 0,
    failedCount: 0,
    errors: []
  };

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const rowNumber = i + 2;

      try {
        // Field mapping as per the provided image
        const licenseData = {
          softwareName: rowData['License Name'] || rowData['Software Name'] || rowData['Name'],
          version: rowData['Version'] || 'N/A',
          invoiceNumber: rowData['Invoice Number'] || '',
          addedBy: rowData['Added By'] || '',
          startDate: rowData['Start Date'] ? new Date(rowData['Start Date']) : null,
          expiryDate: rowData['Expiry Date'] ? new Date(rowData['Expiry Date']) : null,
          seatsLimit: parseInt(rowData['Seats / Limit'] || rowData['Seats'] || 1),
          licenseKey: rowData['License Key'] || '',
          assignedSystem: rowData['Assigned System'] || ''
        };

        if (!licenseData.softwareName) throw new Error(`Row ${rowNumber}: Software Name is required.`);

        // 1. Create the License record
        const newLicense = new License(licenseData);
        await newLicense.save();

        // 2. Update or Create the Software summary record
        let software = await Software.findOne({ name: licenseData.softwareName });

        if (software) {
          // Increment total seats
          software.totalSeats += licenseData.seatsLimit;
          // Increment used seats if Assigned System is provided
          if (licenseData.assignedSystem) {
            software.usedSeats += 1;
          }

          // Re-calculate utilization and status
          software.utilizationPercentage = software.totalSeats > 0
            ? Math.round((software.usedSeats / software.totalSeats) * 100)
            : 0;

          if (software.utilizationPercentage >= 90) {
            software.status = 'Limit Reached';
            software.statusColor = 'red';
          } else if (software.utilizationPercentage >= 75) {
            software.statusColor = 'amber';
          } else {
            software.status = 'Active';
            software.statusColor = 'green';
          }

          await software.save();
        } else {
          // Create new software summary
          const newSoftware = new Software({
            name: licenseData.softwareName,
            version: licenseData.version,
            totalSeats: licenseData.seatsLimit,
            usedSeats: licenseData.assignedSystem ? 1 : 0,
            utilizationPercentage: licenseData.seatsLimit > 0
              ? (licenseData.assignedSystem ? Math.round((1 / licenseData.seatsLimit) * 100) : 0)
              : 0,
            status: 'Active',
            statusColor: 'green'
          });

          // Set status color based on initial utilization
          if (newSoftware.utilizationPercentage >= 90) {
            newSoftware.status = 'Limit Reached';
            newSoftware.statusColor = 'red';
          } else if (newSoftware.utilizationPercentage >= 75) {
            newSoftware.statusColor = 'amber';
          }

          await newSoftware.save();
        }

        results.insertedCount++;

      } catch (error) {
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          message: error.message,
          data: rowData
        });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Bulk upload processing complete",
      summary: {
        total: rows.length,
        inserted: results.insertedCount,
        failed: results.failedCount
      },
      errors: results.errors
    });

  } catch (error) {
    console.error("Bulk upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Failed to process bulk upload file", error: error.message });
  }
});


// GET all software
router.get("/", async (req, res) => {
  try {
    const software = await Software.find().sort({ createdAt: -1 });
    res.json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Failed to fetch software' });
  }
});

// GET software by ID
router.get("/:id", async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Failed to fetch software' });
  }
});

// POST create new software
router.post("/", async (req, res) => {
  try {
    const software = new Software(req.body);
    await software.save();
    res.status(201).json(software);
  } catch (error) {
    console.error('Error creating software:', error);
    res.status(500).json({ message: 'Failed to create software' });
  }
});

// PUT update software
router.put("/:id", async (req, res) => {
  try {
    const software = await Software.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json(software);
  } catch (error) {
    console.error('Error updating software:', error);
    res.status(500).json({ message: 'Failed to update software' });
  }
});

// DELETE software
router.delete("/:id", async (req, res) => {
  try {
    const software = await Software.findByIdAndDelete(req.params.id);
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json({ message: 'Software deleted successfully' });
  } catch (error) {
    console.error('Error deleting software:', error);
    res.status(500).json({ message: 'Failed to delete software' });
  }
});

module.exports = router;
