const express = require("express");
const router = express.Router();
const Desk = require("../models/Desk");
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const { logActivity } = require('../utils/activityLogger');

// BULK UPLOAD Desks
router.post("/bulk-upload", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const results = {
        upsertedCount: 0,
        errors: []
    };

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // User updated format: Standard Excel with headers on Row 1 (index 0).
        // Removing { range: 1 } to use default behavior.
        const rows = xlsx.utils.sheet_to_json(sheet);
        
        console.log(`Processing ${rows.length} rows from upload.`);

        // Clear existing data and indexes by dropping the collection
        // This solves the E11000 duplicate key error on 'deskId' which might be a lingering index
        try {
            await Desk.collection.drop();
            console.log('Dropped existing desks collection');
        } catch (err) {
            // Ignore error if collection doesn't exist
            if (err.code !== 26) {
                console.log('Error dropping collection:', err.message);
            }
        }

        for (let i = 0; i < rows.length; i++) {
            const rowData = rows[i];
            const rowNumber = i + 3;

            try {
                // S.no | WS # | EMP ID | User Name | Project | Manager | Block
                const workstationId = rowData['WS #'];
                
                if (!workstationId) continue;

                const empId = rowData['EMP ID'];
                const userName = rowData['User Name'];
                const project = rowData['Project'];
                const manager = rowData['Manager'];
                const block = rowData['Block'];
                
                // Determine status based on EMP ID (Primary) or User Name (Secondary)
                let status = 'Available';
                const hasEmpId = empId && empId !== 0 && String(empId).trim() !== '';
                const hasUserName = userName && String(userName).toLowerCase() !== 'empty' && String(userName).trim() !== '';
                
                if (hasEmpId || hasUserName) {
                    status = 'Occupied';
                }

                const updateData = {
                    workstationId: String(workstationId).trim(),
                    block: block ? String(block).trim() : 'A',
                    empId: (empId && empId !== 0) ? String(empId).trim() : '',
                    userName: (userName && String(userName).toLowerCase() !== 'empty') ? String(userName).trim() : '',
                    project: (project && project !== 0) ? String(project).trim() : '',
                    manager: (manager && manager !== 0) ? String(manager).trim() : '',
                    status: status,
                    isActive: true
                };

                await Desk.findOneAndUpdate(
                    { workstationId: updateData.workstationId },
                    updateData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                
                results.upsertedCount++;

            } catch (error) {
                results.errors.push({
                    row: rowNumber,
                    message: error.message
                });
            }
        }

        fs.unlinkSync(req.file.path);
        
        await logActivity(
            'Floor Map Updated',
            `Bulk upload processed ${results.upsertedCount} desks`,
            'map',
            'bg-indigo-50 text-indigo-600',
            'other'
        );

        res.json({
            message: "Bulk upload complete",
            summary: {
                total: rows.length,
                upserted: results.upsertedCount,
                failed: results.errors.length
            },
            errors: results.errors
        });

    } catch (error) {
        console.error("Bulk upload error:", error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Failed to process file", error: error.message });
    }
});

// GET All Desks
router.get("/", async (req, res) => {
  try {
    const desks = await Desk.find();
    res.json(desks);
  } catch (error) {
    console.error('Error fetching desks:', error);
    res.status(500).json({ message: 'Failed to fetch desks' });
  }
});

// UPDATE Desk
router.put("/:id", async (req, res) => {
  try {
    const { empId, userName } = req.body;

    // Check for duplicate EMP ID if one is provided
    if (empId && String(empId).trim() !== '') {
        const existingDesk = await Desk.findOne({ 
            empId: String(empId).trim(), 
            _id: { $ne: req.params.id } 
        });
        
        if (existingDesk) {
            return res.status(400).json({ 
                message: `Employee ID ${empId} is already assigned to seat ${existingDesk.workstationId}` 
            });
        }
    }

    // Auto-determine status based on EMP ID presence
    const status = (empId && String(empId).trim() !== '') ? 'Occupied' : 'Available';
    
    // Inject status into body
    req.body.status = status;

    const originalDesk = await Desk.findById(req.params.id);

    const updatedDesk = await Desk.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDesk) return res.status(404).json({ message: "Desk not found" });

    // Log Activity
    const actor = req.body.modifiedBy || 'Admin'; // Default actor if not provided

    if (status === 'Occupied' && originalDesk.status !== 'Occupied') {
        const whoStr = userName ? `${userName}` : `Emp ${empId}`;
        await logActivity(
            'Seat Assigned',
            `${actor} assigned Seat ${updatedDesk.workstationId} to ${whoStr}`,
            'person_add',
            'bg-green-50 text-green-600',
            'reservation'
        );
    } else if (status === 'Available' && originalDesk.status === 'Occupied') {
        await logActivity(
            'Seat Unassigned',
            `Seat ${originalDesk.workstationId} was unassigned by ${actor}`,
            'person_remove',
            'bg-gray-50 text-gray-600',
            'reservation'
        );
    }

    res.json(updatedDesk);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

// DELETE All Desks
router.delete("/all", async (req, res) => {
    try {
        await Desk.deleteMany({});
        res.json({ message: "All desks deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
