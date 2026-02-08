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
        // Normalize header keys (trim + lowercase) so we accept common variants
        const normalizedRow = {};
        for (const key in rowData) {
          if (!Object.prototype.hasOwnProperty.call(rowData, key)) continue;
          const k = String(key).trim().toLowerCase();
          normalizedRow[k] = rowData[key];
        }

        const findFirst = (obj, keys) => {
          for (const k of keys) {
            if (obj[k] !== undefined && String(obj[k]).trim() !== '') return obj[k];
          }
          return undefined;
        };

        const empIdKeys = ['emp id', 'empid', 'employee id', 'employeeid', 'employee number', 'employee_number', 'emp_number', 'id'];
        const fullNameKeys = ['full name', 'fullname', 'name', 'employee name', 'emp name', 'user name', 'username', 'user'];
        const emailKeys = ['email', 'email address', 'email_address', 'e-mail'];
        const mobileKeys = ['mobile', 'phone', 'mobile number', 'phone number', 'contact', 'contact number'];
        const departmentKeys = ['department', 'dept'];
        const subDepartmentKeys = ['sub department', 'subdepartment', 'sub dept', 'subdept', 'sub-department'];
        const workstationKeys = ['workstation', 'workstation id', 'workstationid', 'desk', 'desk id', 'deskid', 'seat', 'seat id'];

        // Log the normalizedRow for the first few rows to help debug header mapping
        if (i < 5) {
          try {
            console.log(`Row preview ${rowNumber}:`, normalizedRow);
          } catch (e) {
            // ignore logging errors
          }
        }

        const empId = findFirst(normalizedRow, empIdKeys);
        const fullName = findFirst(normalizedRow, fullNameKeys);
        const email = findFirst(normalizedRow, emailKeys);
        const mobile = findFirst(normalizedRow, mobileKeys);
        const department = findFirst(normalizedRow, departmentKeys);
        const subDepartment = findFirst(normalizedRow, subDepartmentKeys);
        const workstationId = findFirst(normalizedRow, workstationKeys);

        const isEmptyValue = (v) => {
          if (v === undefined || v === null) return true;
          const s = String(v).trim().toLowerCase();
          return s === '' || s === '0' || s === 'empty' || s === 'na' || s === 'n/a' || s === '-';
        };

        // If both empId and fullName indicate an empty seat, skip silently
        if (isEmptyValue(empId) && isEmptyValue(fullName)) {
          results.skippedCount = (results.skippedCount || 0) + 1;
          continue;
        }

        // If one is missing but the other is present, treat as an error
        if (isEmptyValue(empId) || isEmptyValue(fullName)) {
          throw new Error(`Row ${rowNumber}: Missing EMP ID or Full Name`);
        }

        // Prepare employee data
        const employeeData = {
          empId: String(empId).trim(),
          fullName: String(fullName).trim(),
          email: email && !isEmptyValue(email) ? String(email).trim() : '',
          mobile: mobile && !isEmptyValue(mobile) ? String(mobile).trim() : '',
          department: department && !isEmptyValue(department) ? String(department).trim() : '',
          subDepartment: subDepartment && !isEmptyValue(subDepartment) ? String(subDepartment).trim() : '',
          workstationId: workstationId && !isEmptyValue(workstationId) ? String(workstationId).trim() : ''
        };

        // Upsert Employee
        await Employee.findOneAndUpdate(
          { empId: String(empId).trim() },
          employeeData,
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
        failed: results.errors.length,
        skipped: results.skippedCount || 0
      },
      errors: results.errors
    });

  } catch (error) {
    console.error("Bulk upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Failed to process file", error: error.message });
  }
});

// GET Employees (supports pagination and search)
// Query params: page (1-based), limit, q (search term)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '20', 10));
    const q = req.query.q ? String(req.query.q).trim() : '';

    const filter = {};
    if (q) {
      // search across empId, fullName and email
      filter.$or = [
        { empId: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Employee.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;

    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: employees,
      total,
      page,
      pages,
      limit
    });
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

    // Status Check (Block Inactive/Disabled users)
    if (employee.status === 'Inactive' || employee.isActive === false) {
      return res.status(403).json({
        message: "User account is inactive. Please contact your administrator."
      });
    }

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
