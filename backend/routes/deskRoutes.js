const express = require("express");
const router = express.Router();
const Desk = require("../models/Desk");
const Asset = require("../models/Asset");
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

// Helper function to extract block from workstation ID (e.g., WS-3A-101 -> 3A)
function extractBlockFromWorkstation(wsId) {
    if (!wsId) return 'A';
    const match = String(wsId).match(/WS-(\d+[A-Z])-/);
    return match ? match[1] : 'A';
}

// Helper function to normalize asset type to match schema enum
function normalizeAssetType(type) {
    if (!type) return 'Other';
    
    const typeStr = String(type).trim();
    const validTypes = ['Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Smartphone', 'Tablet', 'Other'];
    
    // Try exact match (case-insensitive)
    const exactMatch = validTypes.find(t => t.toLowerCase() === typeStr.toLowerCase());
    if (exactMatch) return exactMatch;
    
    // Try partial matches for common variations
    const lowerType = typeStr.toLowerCase();
    if (lowerType.includes('laptop') || lowerType.includes('notebook')) return 'Laptop';
    if (lowerType.includes('monitor') || lowerType.includes('display') || lowerType.includes('screen')) return 'Monitor';
    if (lowerType.includes('mouse') || lowerType.includes('mice')) return 'Mouse';
    if (lowerType.includes('keyboard') || lowerType.includes('kbd')) return 'Keyboard';
    if (lowerType.includes('phone') || lowerType.includes('mobile')) return 'Smartphone';
    if (lowerType.includes('tablet') || lowerType.includes('ipad')) return 'Tablet';
    
    return 'Other';
}

// BULK UPLOAD Desks
router.post("/bulk-upload", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const results = {
        upsertedCount: 0,
        assetsCreated: 0,
        errors: []
    };

    try {
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        if (fileExt === '.csv') {
            // Parse CSV file
            const workbook = xlsx.readFile(req.file.path, { type: 'file' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rows = xlsx.utils.sheet_to_json(sheet);
        } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            // Parse Excel file
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rows = xlsx.utils.sheet_to_json(sheet);
        } else {
            return res.status(400).json({ message: "Unsupported file format. Please upload CSV or XLSX file." });
        }

        console.log(`Processing ${rows.length} rows from upload.`);

        // Clear existing desk data
        try {
            await Desk.collection.drop();
            console.log('Dropped existing desks collection');
        } catch (err) {
            if (err.code !== 26) {
                console.log('Error dropping collection:', err.message);
            }
        }

        // Group rows by workstation to aggregate desk info and collect all assets
        const workstationMap = new Map();

        for (let i = 0; i < rows.length; i++) {
            const rowData = rows[i];
            const rowNumber = i + 2;

            try {
                const workstationId = rowData['WS #'] || rowData['Workstation ID'];
                if (!workstationId) continue;

                const empId = rowData['EMP ID'];
                const userName = rowData['User Name'] || rowData['Full Name'];
                const project = rowData['Project'] || rowData['Department'];
                const manager = rowData['Manager'];
                const block = rowData['Block'] || extractBlockFromWorkstation(workstationId);

                // Create/update workstation entry
                if (!workstationMap.has(workstationId)) {
                    const hasEmpId = empId && empId !== 0 && String(empId).trim() !== '';
                    const hasUserName = userName && String(userName).toLowerCase() !== 'empty' && String(userName).trim() !== '';
                    
                    workstationMap.set(workstationId, {
                        workstationId: String(workstationId).trim(),
                        block: block ? String(block).trim() : 'A',
                        empId: (empId && empId !== 0) ? String(empId).trim() : '',
                        userName: (userName && String(userName).toLowerCase() !== 'empty') ? String(userName).trim() : '',
                        project: (project && project !== 0) ? String(project).trim() : '',
                        manager: (manager && manager !== 0) ? String(manager).trim() : '',
                        status: (hasEmpId || hasUserName) ? 'Occupied' : 'Available',
                        isActive: true
                    });
                }

                // Process asset data if present
                const assetId = rowData['Asset Id'];
                const assetName = rowData['Asset Name'];
                const assetType = rowData['Asset Type'];
                
                if (assetId && assetName) {
                    const normalizedType = normalizeAssetType(assetType);
                    
                    console.log(`Processing asset: ${assetName} | Original Type: "${assetType}" | Normalized: "${normalizedType}"`);
                    
                    const assetData = {
                        assetTag: String(assetId).trim(),
                        assetName: String(assetName).trim(),
                        assetType: normalizedType,
                        model: rowData['Asset Model'] || '',
                        make: rowData['Make'] || '',
                        serialNumber: rowData['Serial Number'] || '',
                        status: rowData['Asset Status'] || 'Assigned',
                        condition: rowData['Asset Condition'] || 'Good',
                        warrantyExpiry: rowData['Warranty Expires On'] ? new Date(rowData['Warranty Expires On']) : null,
                        assignmentDate: rowData['Assignment Date'] ? new Date(rowData['Assignment Date']) : null,
                        assignedTo: userName && String(userName).toLowerCase() !== 'empty' ? String(userName).trim() : '',
                        employee: {
                            number: empId ? String(empId).trim() : '',
                            name: userName && String(userName).toLowerCase() !== 'empty' ? String(userName).trim() : '',
                            department: project ? String(project).trim() : '',
                            subDepartment: rowData['Sub Department'] || ''
                        },
                        specs: {
                            processor: rowData['Processor'] || '',
                            memory: rowData['RAM'] || '',
                            storage: rowData['HDD'] || ''
                        }
                    };

                    // Upsert asset
                    await Asset.findOneAndUpdate(
                        { assetTag: assetData.assetTag },
                        assetData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    results.assetsCreated++;
                }

            } catch (error) {
                results.errors.push({
                    row: rowNumber,
                    message: error.message
                });
            }
        }

        // Insert all unique workstations
        for (const deskData of workstationMap.values()) {
            await Desk.findOneAndUpdate(
                { workstationId: deskData.workstationId },
                deskData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        fs.unlinkSync(req.file.path);

        await logActivity(
            'Floor Map & Assets Updated',
            `Bulk upload: ${results.upsertedCount} desks, ${results.assetsCreated} assets`,
            'map',
            'bg-indigo-50 text-indigo-600',
            'other'
        );

        res.json({
            message: "Bulk upload complete",
            summary: {
                total: rows.length,
                desks: results.upsertedCount,
                assets: results.assetsCreated,
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

// GET Desk by Employee ID
router.get("/employee/:empId", async (req, res) => {
    try {
        const desk = await Desk.findOne({ empId: req.params.empId });
        if (!desk) return res.status(404).json({ message: "No desk assigned to this employee" });
        res.json(desk);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch desk info' });
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
