const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

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

// BULK UPLOAD Employees
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

    // Headers are on Row 1 (default) based on user image
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Processing ${rows.length} employee rows.`);

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const rowNumber = i + 2; // Data starts at row 2 visually

      try {
        // Mapping based on user image: "S NO", "EMP ID", "Full Name"
        const empId = rowData['EMP ID'];
        const fullName = rowData['Full Name'];

        if (!empId || !fullName) {
          throw new Error(`Row ${rowNumber}: Missing EMP ID or Full Name`);
        }

        // Upsert Employee
        await Employee.findOneAndUpdate(
          { empId: String(empId).trim() },
          {
            empId: String(empId).trim(),
            fullName: String(fullName).trim(),
            // Default to Employee/Active if not in excel, or standard defaults apply on upsert
            // If columns exist in excel, we could map them too. Assuming not for now.
          },
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

// GET All Employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

// CREATE Employee (Manual Add)
router.post("/", async (req, res) => {
  try {
    const { empId, fullName } = req.body;

    if (!empId || !fullName) {
      return res.status(400).json({ message: "EMP ID and Full Name are required" });
    }

    // Check duplicate
    const existing = await Employee.findOne({ empId: String(empId).trim() });
    if (existing) {
      return res.status(400).json({ message: "Employee with this ID already exists" });
    }

    const employee = new Employee({
      empId: String(empId).trim(),
      fullName: String(fullName).trim(),
      role: req.body.role || 'Employee',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      email: req.body.email || '',
      department: req.body.department || ''
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET Employee by ID or EmpID
router.get("/:id", async (req, res) => {
  try {
    let employee;
    const { ObjectId } = require('mongoose').Types;

    if (ObjectId.isValid(req.params.id)) {
      employee = await Employee.findById(req.params.id);
    }

    if (!employee) {
      employee = await Employee.findOne({ empId: req.params.id });
    }

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee" });
  }
});

// UPDATE Employee
router.patch("/:id", async (req, res) => {
  try {
    let query = {};
    const { ObjectId } = require('mongoose').Types;

    if (ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { empId: req.params.id };
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });
    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE Employee
router.delete("/:id", async (req, res) => {
  try {
    let deletedEmployee;
    const { ObjectId } = require('mongoose').Types;

    if (ObjectId.isValid(req.params.id)) {
      deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    }

    if (!deletedEmployee) {
      deletedEmployee = await Employee.findOneAndDelete({ empId: req.params.id });
    }

    if (!deletedEmployee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

module.exports = router;
