const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { logAssetEvent } = require("../services/historyService");
const AssetHistory = require("../models/AssetHistory");
const { logActivity } = require('../utils/activityLogger');

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
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

// Middleware for validating asset data
const validateAssetData = (req, res, next) => {
  const { assetName, assetType, status } = req.body;

  if (!assetName || typeof assetName !== 'string' || assetName.trim().length === 0) {
    return res.status(400).json({ message: 'Asset name is required and must be a non-empty string' });
  }

  const validAssetTypes = ['Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Smartphone', 'Tablet', 'Other'];
  if (assetType && !validAssetTypes.includes(assetType)) {
    // Allow it to pass if not provided (will use default), but if provided must be valid.
    // However the strictly typed requirement suggests we should validate.
    // Existing code enforced it, so we keep it. but 'default' is 'Laptop' in schema.
    return res.status(400).json({ message: 'Invalid asset type' });
  }

  const validStatuses = ['IN USE', 'STORAGE', 'REPAIR', 'Available', 'Assigned', 'Not Available', 'Damaged'];
  // Updated to include new statuses
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  next();
};

// ... (Existing routes) ...

// BULK UPLOAD Assets
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
      const rowNumber = i + 2; // Excel row number (1-based header is 1)

      try {
        // Map Excel columns to Asset model fields
        // Excel Column Structure (Mandatory)
        // Asset Id, Asset Name, Asset Description / Location, Warranty Expires On, Asset Condition, Asset Status, Reason, if Not Available, Employee Number, if Assigned, Employee Name if Assigned, Employee Department if Assigned, Employee Sub Department if Assigned, Date of Asset Assignment, Invoice No, Vendor Name, PO, Asset Serial/Tag, RAM, Processor, HDD, Asset Model, Make

        const mappedAsset = {
          assetTag: rowData['Asset Id'],
          assetName: rowData['Asset Name'],
          assetType: rowData['Asset Type'] || rowData['Type'] || 'Laptop',
          description: rowData['Asset Description / Location'],
          warrantyExpiry: rowData['Warranty Expires On'], // Date parsing might be needed
          condition: rowData['Asset Condition'],
          status: rowData['Asset Status'],
          reasonNotAvailable: rowData['Reason, if Not Available'],
          assignmentDate: rowData['Date of Asset Assignment'],
          invoiceNumber: rowData['Invoice No'],
          vendorName: rowData['Vendor Name'],
          purchaseOrderNumber: rowData['PO'],
          serialNumber: rowData['Asset Serial/Tag'] || rowData['Asset Serial'], // Handle potential naming variations
          model: rowData['Asset Model'],
          make: rowData['Make'],
          specs: {
            memory: rowData['RAM'],
            processor: rowData['Processor'],
            storage: rowData['HDD']
          },
          employee: {}
        };

        // Validate Status and Employee fields
        if (mappedAsset.status === 'Assigned') {
          if (!rowData['Employee Number, if Assigned'] || !rowData['Employee Name if Assigned']) {
            throw new Error(`Row ${rowNumber}: Status is Assigned but Employee Number or Name is missing.`);
          }
          mappedAsset.employee = {
            number: rowData['Employee Number, if Assigned'],
            name: rowData['Employee Name if Assigned'],
            department: rowData['Employee Department if Assigned'],
            subDepartment: rowData['Employee Sub Department if Assigned']
          };
        }

        // Basic Validation (Check required fields)
        if (!mappedAsset.assetName) throw new Error(`Row ${rowNumber}: Asset Name is required.`);
        if (!mappedAsset.assetTag) throw new Error(`Row ${rowNumber}: Asset Id (Tag) is required.`);

        // Check for duplicate Asset Tag in DB - Update if exists, create if new
        const existingAsset = await Asset.findOne({ assetTag: mappedAsset.assetTag });
        if (existingAsset) {
          // Update existing asset
          const updated = await Asset.findByIdAndUpdate(existingAsset._id, mappedAsset, { new: true });
          results.insertedCount++; // Still count as processed

          // Log history for bulk update
          await logAssetEvent(existingAsset._id, 'UPDATED', {
            via: 'Bulk Upload',
            message: 'Asset details updated via bulk import'
          }, 'System');
        } else {
          // Create new asset
          const newAsset = new Asset(mappedAsset);
          await newAsset.save();
          results.insertedCount++;

          // Log history
          await logAssetEvent(newAsset._id, 'CREATED', {
            name: newAsset.assetName,
            tag: newAsset.assetTag,
            via: 'Bulk Upload'
          }, 'System');
        }

      } catch (error) {
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          message: error.message,
          data: rowData
        });
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    // Activity Log
    if (results.insertedCount > 0) {
      await logActivity(
        'Assets Imported',
        `Bulk upload added ${results.insertedCount} new assets`,
        'cloud_upload',
        'bg-indigo-50 text-indigo-600',
        'asset'
      );
    }

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
    // Attempt cleanup
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Failed to process bulk upload file", error: error.message });
  }
});

// CREATE Asset
router.post("/", validateAssetData, async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const savedAsset = await asset.save();

    // Log Creation
    const actor = req.body.addedBy || 'System';

    await logActivity(
      'New Asset Added',
      `${actor} added ${savedAsset.assetName} (${savedAsset.assetTag}) to inventory`,
      'add_circle',
      'bg-green-50 text-green-600',
      'asset'
    );

    // Log Lifecycle Event
    await logAssetEvent(
      savedAsset._id,
      'CREATED',
      { name: savedAsset.assetName, tag: savedAsset.assetTag },
      actor
    );

    res.status(201).json(savedAsset);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Asset tag must be unique' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// GET All Assets
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignedTo) {
      // assets stored employee.number as string
      filter['employee.number'] = req.query.assignedTo;
    }
    if (req.query.status) {
      filter['status'] = req.query.status;
      if (req.query.status === 'Available') {
        filter['$or'] = [
          { 'employee.number': { $exists: false } },
          { 'employee.number': null },
          { 'employee.number': '' }
        ];
      }
    }
    const assets = await Asset.find(filter);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
});

// GET Asset by ID
// GET Asset by ID or Asset Tag
router.get("/:id", async (req, res) => {
  try {
    let asset;
    const { ObjectId } = require('mongoose').Types;

    // Check if valid ObjectId
    if (ObjectId.isValid(req.params.id)) {
      asset = await Asset.findById(req.params.id);
    }

    // If not found by ID or not a valid ID, try searching by assetTags
    if (!asset) {
      asset = await Asset.findOne({ assetTag: req.params.id });
    }

    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Failed to fetch asset' });
  }
});

// UPDATE Asset
// UPDATE Asset
router.put("/:id", validateAssetData, async (req, res) => {
  try {
    let query = {};
    const { ObjectId } = require('mongoose').Types;

    if (ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { assetTag: req.params.id };
    }

    // Get original for comparison
    const originalAsset = await Asset.findOne(query);

    const updatedAsset = await Asset.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAsset) return res.status(404).json({ message: "Asset not found" });

    // Log Assignment Changes
    const actor = req.body.modifiedBy || req.body.addedBy || 'Admin';

    if (originalAsset) {
      // Detect Field Changes
      const changes = {};
      const fieldsToTrack = ['assetName', 'status', 'condition', 'description', 'model', 'make'];
      fieldsToTrack.forEach(field => {
        const newValue = req.body[field];
        const oldValue = originalAsset[field];
        if (newValue !== undefined && String(newValue) !== String(oldValue)) {
          changes[field] = { old: oldValue, new: newValue };
        }
      });

      // Track Employee Changes
      if (req.body.employee) {
        ['number', 'name', 'department'].forEach(field => {
          const newValue = req.body.employee[field];
          const oldValue = originalAsset.employee ? originalAsset.employee[field] : undefined;
          if (newValue !== undefined && String(newValue) !== String(oldValue)) {
            changes[`employee.${field}`] = { old: oldValue, new: newValue };
          }
        });
      }

      if (Object.keys(changes).length > 0) {
        await logAssetEvent(updatedAsset._id, 'UPDATED', { changes }, actor);
      }

      // Lifecycle Transitions
      const isNowAssigned = updatedAsset.status === 'Assigned' || (updatedAsset.employee && updatedAsset.employee.number);
      const wasAssigned = originalAsset.status === 'Assigned' || (originalAsset.employee && originalAsset.employee.number);

      if (isNowAssigned && !wasAssigned) {
        const assignee = updatedAsset.employee?.name || updatedAsset.assignedTo || 'Employee';
        await logAssetEvent(updatedAsset._id, 'ASSIGNED', { to: assignee, employeeNumber: updatedAsset.employee?.number }, actor);
      } else if (!isNowAssigned && wasAssigned) {
        const releasedFrom = originalAsset.employee?.name || 'Employee';
        await logAssetEvent(updatedAsset._id, 'RELEASED', { from: releasedFrom }, actor);
      } else if (isNowAssigned && wasAssigned && updatedAsset.employee?.number !== originalAsset.employee?.number) {
        await logAssetEvent(updatedAsset._id, 'REASSIGNED', {
          from: originalAsset.employee?.name,
          to: updatedAsset.employee?.name,
          fromNumber: originalAsset.employee?.number,
          toNumber: updatedAsset.employee?.number
        }, actor);
      }

      // Log to Global Activity Feed (Legacy Support)
      if (updatedAsset.status === 'Assigned' && originalAsset.status !== 'Assigned') {
        const assignee = updatedAsset.employee?.name || updatedAsset.assignedTo || 'Employee';
        await logActivity(
          'Asset Assigned',
          `${actor} assigned ${updatedAsset.assetName} ${updatedAsset.assetTag} to ${assignee}`,
          'assignment_ind',
          'bg-blue-50 text-blue-600',
          'asset'
        );
      } else if (updatedAsset.status === 'Available' && originalAsset.status === 'Assigned') {
        await logActivity(
          'Asset Returned',
          `${updatedAsset.assetName} ${updatedAsset.assetTag} returned to inventory by ${actor}`,
          'assignment_return',
          'bg-gray-50 text-gray-600',
          'asset'
        );
      }
    }

    res.json(updatedAsset);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Asset tag must be unique' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// DELETE Asset
// DELETE Batch Assets
router.post("/delete-batch", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const { ObjectId } = require('mongoose').Types;

    // This logic handles both _ids and assetTags, similar to our single delete/get logic
    // We find docs that match _id IN ids OR assetTag IN ids

    // Split ids into valid ObjectIds and others (assumed tags)
    const objectIds = ids.filter(id => ObjectId.isValid(id));
    const otherIds = ids.filter(id => !ObjectId.isValid(id));

    const result = await Asset.deleteMany({
      $or: [
        { _id: { $in: objectIds } },
        { assetTag: { $in: otherIds } },
        { assetTag: { $in: objectIds } } // In case an assetTag looks like an ObjectId? Unlikely but possible
      ]
    });

    res.json({ message: "Assets deleted successfully", count: result.deletedCount });
  } catch (error) {
    console.error('Error deleting assets:', error);
    res.status(500).json({ message: 'Failed to delete assets' });
  }
});

// DELETE All Assets
router.delete("/all-assets", async (req, res) => {
  try {
    const result = await Asset.deleteMany({});
    res.json({ message: "All assets deleted successfully", count: result.deletedCount });
  } catch (error) {
    console.error('Error deleting all assets:', error);
    res.status(500).json({ message: 'Failed to delete all assets' });
  }
});

// GET Asset History
router.get("/:id/history", async (req, res) => {
  try {
    const { ObjectId } = require('mongoose').Types;
    let query = {};
    const idParam = req.params.id;

    if (ObjectId.isValid(idParam)) {
      query = { _id: idParam };
    } else {
      query = { assetTag: idParam };
    }

    const asset = await Asset.findOne(query);
    if (!asset) {
      // If we can't find the asset, at least try a literal search on history just in case
      const history = await AssetHistory.find({ assetId: idParam })
        .sort({ performedAt: -1 })
        .limit(50);
      return res.json(history);
    }

    // Modern approach: Search history using the canonical _id and the assetTag
    const history = await AssetHistory.find({
      $or: [
        { assetId: asset._id.toString() },
        { assetId: asset.assetTag }
      ]
    })
      .sort({ performedAt: -1 })
      .limit(100);

    res.json(history);
  } catch (error) {
    console.error('Error fetching asset history:', error);
    res.status(500).json({ message: 'Failed to fetch asset history' });
  }
});

// DELETE Asset
router.delete("/:id", async (req, res) => {
  try {
    let deletedAsset;
    const { ObjectId } = require('mongoose').Types;

    if (ObjectId.isValid(req.params.id)) {
      deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    }

    if (!deletedAsset) {
      deletedAsset = await Asset.findOneAndDelete({ assetTag: req.params.id });
    }

    if (!deletedAsset) return res.status(404).json({ message: "Asset not found" });

    // Log Deletion
    await logActivity(
      'Asset Deleted',
      `${deletedAsset.assetName} (${deletedAsset.assetTag}) removed from system`,
      'delete',
      'bg-red-50 text-red-600',
      'asset'
    );

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Failed to delete asset' });
  }
});

module.exports = router;
