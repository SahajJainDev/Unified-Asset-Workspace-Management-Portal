const express = require('express');
const router = express.Router();
const Verification = require('../models/Verification');
const VerificationCycle = require('../models/VerificationCycle');
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');

// POST a new verification (single)
router.post('/', async (req, res) => {
    try {
        const { assetId, enteredAssetId, employeeId, status, notes, cycleId } = req.body;

        const employee = await Employee.findOne({ empId: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // If cycleId provided, validate cycle is active and check for duplicate asset submission
        if (cycleId) {
            const cycle = await VerificationCycle.findById(cycleId);
            if (!cycle || cycle.status !== 'active') {
                return res.status(400).json({ message: 'No active verification cycle found. Please wait for admin to start a new cycle.' });
            }
            
            // Check if this specific asset has already been verified by this employee in this cycle
            const alreadySubmitted = await Verification.findOne({ cycleId, employeeId, assetId });
            if (alreadySubmitted) {
                return res.status(400).json({ message: 'You have already submitted verification for this asset in this cycle.' });
            }
        }

        const verification = new Verification({
            assetId,
            enteredAssetId,
            employeeId,
            employeeName: employee.fullName,
            status,
            notes,
            cycleId: cycleId || null
        });

        const savedVerification = await verification.save();
        res.status(201).json(savedVerification);
    } catch (error) {
        console.error('Error saving verification:', error);
        res.status(500).json({ message: 'Failed to save verification' });
    }
});

// POST batch verification (employee submits all assets at once)
router.post('/batch', async (req, res) => {
    try {
        const { employeeId, cycleId, verifications: items } = req.body;

        const employee = await Employee.findOne({ empId: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Validate cycle is active
        if (cycleId) {
            const cycle = await VerificationCycle.findById(cycleId);
            if (!cycle || cycle.status !== 'active') {
                return res.status(400).json({ message: 'No active verification cycle found.' });
            }
        }

        const saved = [];
        const skipped = [];
        
        for (const item of items) {
            // Check if this asset was already submitted in this cycle
            if (cycleId) {
                const existing = await Verification.findOne({ cycleId, employeeId, assetId: item.assetId });
                if (existing) {
                    skipped.push(item.assetId);
                    continue;
                }
            }
            
            const verification = new Verification({
                assetId: item.assetId,
                enteredAssetId: item.enteredAssetId,
                employeeId,
                employeeName: employee.fullName,
                status: item.status,
                notes: item.notes || '',
                cycleId: cycleId || null
            });
            const s = await verification.save();
            saved.push(s);
        }

        res.status(201).json({ 
            message: `${saved.length} verifications saved${skipped.length > 0 ? `, ${skipped.length} already submitted` : ''}`, 
            count: saved.length,
            skipped: skipped.length
        });
    } catch (error) {
        console.error('Error saving batch verification:', error);
        res.status(500).json({ message: 'Failed to save batch verification' });
    }
});

// GET all verifications (flat log for legacy)
router.get('/', async (req, res) => {
    try {
        const verifications = await Verification.find()
            .populate('assetId', 'assetName assetTag assetType')
            .sort({ verificationDate: -1 });

        const formatted = verifications.map(v => ({
            id: v.assetId ? v.assetId._id : '',
            assetTag: v.assetId ? v.assetId.assetTag : 'N/A',
            enteredAssetId: v.enteredAssetId,
            assetName: v.assetId ? v.assetId.assetName : 'Unknown Asset',
            assetType: v.assetId ? v.assetId.assetType : 'Unknown',
            employeeName: v.employeeName,
            employeeId: v.employeeId,
            date: v.verificationDate.toISOString().split('T')[0],
            time: v.verificationDate.toLocaleTimeString(),
            status: v.status,
            statusColor: v.status === 'Verified' ? 'green' : v.status === 'Flagged' ? 'amber' : 'blue'
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        res.status(500).json({ message: 'Failed to fetch verifications' });
    }
});

// GET aggregated verification summary per employee (for admin)
// Shows ALL employees with assigned assets — defaults to Pending for those who haven't submitted
router.get('/summary', async (req, res) => {
    try {
        const { cycleId } = req.query;
        const mongoose = require('mongoose');

        // 1. Get ALL employees who have assigned assets
        const allAssignedAssets = await Asset.find({
            $or: [
                { status: 'Assigned' },
                { 'employee.number': { $exists: true, $ne: '' } },
                { assignedTo: { $exists: true, $ne: '', $ne: null } }
            ]
        }).lean();

        // Group assigned assets by employee
        const assetsByEmployee = {};
        allAssignedAssets.forEach(asset => {
            const empId = asset.employee?.number || asset.assignedTo || '';
            if (!empId) return;
            if (!assetsByEmployee[empId]) {
                assetsByEmployee[empId] = {
                    empId,
                    empName: asset.employee?.name || asset.assignedTo || '',
                    department: asset.employee?.department || '',
                    assets: []
                };
            }
            assetsByEmployee[empId].assets.push(asset);
        });

        // 2. Get existing verifications (optionally filtered by cycle)
        const matchFilter = {};
        if (cycleId) {
            matchFilter.cycleId = new mongoose.Types.ObjectId(cycleId);
        }

        const allVerifications = await Verification.find(matchFilter)
            .populate('assetId', 'assetName assetTag assetType')
            .sort({ verificationDate: -1 })
            .lean();

        // Group verifications by employee
        const verificationsByEmployee = {};
        allVerifications.forEach(v => {
            const empId = v.employeeId;
            if (!verificationsByEmployee[empId]) {
                verificationsByEmployee[empId] = {
                    employeeName: v.employeeName,
                    lastVerifiedDate: v.verificationDate,
                    verifications: []
                };
            }
            verificationsByEmployee[empId].verifications.push(v);
        });

        // 3. Build unified summaries: merge all employees with their verifications
        const summaries = [];
        const processedEmployees = new Set();

        // Process all employees with assigned assets
        for (const [empId, empData] of Object.entries(assetsByEmployee)) {
            processedEmployees.add(empId);

            const verData = verificationsByEmployee[empId];
            const totalAssigned = empData.assets.length;

            let totalVerified = 0;
            let verified = 0;
            let flagged = 0;
            let pending = 0;
            let lastVerifiedDate = null;
            let employeeName = empData.empName;

            if (verData) {
                const vList = verData.verifications;
                totalVerified = vList.length;
                verified = vList.filter(v => v.status === 'Verified').length;
                flagged = vList.filter(v => v.status === 'Flagged').length;
                pending = vList.filter(v => v.status === 'Pending').length;
                lastVerifiedDate = verData.lastVerifiedDate;
                employeeName = verData.employeeName || empData.empName;
            }

            // Assets not yet verified count as pending
            const unverifiedCount = Math.max(0, totalAssigned - totalVerified);
            pending += unverifiedCount;

            // Overall status logic
            let overallStatus = 'Pending';
            if (flagged > 0) {
                overallStatus = 'Discrepant';
            } else if (pending > 0) {
                overallStatus = 'Pending';
            } else if (verified > 0 && verified === totalVerified && unverifiedCount === 0) {
                overallStatus = 'Verified';
            }

            // Get employee details for department if not already available
            let department = empData.department;
            if (!department) {
                const employee = await Employee.findOne({ empId });
                department = employee?.department || 'N/A';
            }

            summaries.push({
                employeeId: empId,
                employeeName: employeeName || empId,
                department,
                lastVerifiedDate,
                totalAssigned,
                totalAssets: totalVerified,
                verified,
                flagged,
                pending,
                overallStatus
            });
        }

        // 4. Include employees who submitted verifications but have no current assigned assets
        for (const [empId, verData] of Object.entries(verificationsByEmployee)) {
            if (processedEmployees.has(empId)) continue;

            const vList = verData.verifications;
            const verified = vList.filter(v => v.status === 'Verified').length;
            const flagged = vList.filter(v => v.status === 'Flagged').length;
            const pending = vList.filter(v => v.status === 'Pending').length;

            let overallStatus = 'Pending';
            if (flagged > 0) overallStatus = 'Discrepant';
            else if (pending > 0) overallStatus = 'Discrepant';
            else if (verified === vList.length) overallStatus = 'Verified';

            const employee = await Employee.findOne({ empId });

            summaries.push({
                employeeId: empId,
                employeeName: verData.employeeName,
                department: employee?.department || 'N/A',
                lastVerifiedDate: verData.lastVerifiedDate,
                totalAssigned: 0,
                totalAssets: vList.length,
                verified,
                flagged,
                pending,
                overallStatus
            });
        }

        // Sort: Pending first, then Discrepant, then Verified. Within each group, by name.
        const statusOrder = { Pending: 0, Discrepant: 1, Verified: 2 };
        summaries.sort((a, b) => {
            const orderDiff = (statusOrder[a.overallStatus] ?? 3) - (statusOrder[b.overallStatus] ?? 3);
            if (orderDiff !== 0) return orderDiff;
            return a.employeeName.localeCompare(b.employeeName);
        });

        res.json(summaries);
    } catch (error) {
        console.error('Error fetching verification summary:', error);
        res.status(500).json({ message: 'Failed to fetch verification summary' });
    }
});

// GET detailed verification for a specific employee (admin detail view)
router.get('/employee/:empId', async (req, res) => {
    try {
        const { empId } = req.params;
        const { cycleId } = req.query;

        const employee = await Employee.findOne({ empId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Build query filter
        const filter = { employeeId: empId };
        if (cycleId) {
            filter.cycleId = cycleId;
        }

        // Get verifications for this employee (filtered by cycle if provided)
        const verifications = await Verification.find(filter)
            .populate('assetId', 'assetName assetTag assetType model serialNumber')
            .sort({ verificationDate: -1 });

        // Map verifications to asset detail objects
        const assets = verifications.map(v => ({
            assetId: v.assetId ? v.assetId._id : null,
            assetTag: v.assetId ? v.assetId.assetTag : 'N/A',
            assetName: v.assetId ? v.assetId.assetName : 'Unknown Asset',
            assetType: v.assetId ? v.assetId.assetType : 'Unknown',
            model: v.assetId ? v.assetId.model : '',
            serialNumber: v.assetId ? v.assetId.serialNumber : '',
            enteredAssetId: v.enteredAssetId,
            status: v.status,
            notes: v.notes,
            verificationDate: v.verificationDate,
            isMatch: v.assetId ? (v.enteredAssetId === v.assetId.assetTag) : false
        }));

        const totalAssets = assets.length;
        const matched = assets.filter(v => v.isMatch).length;
        const mismatched = assets.filter(v => !v.isMatch && v.status !== 'Flagged').length;
        const flagged = assets.filter(v => v.status === 'Flagged').length;

        let overallStatus = 'Pending';
        if (totalAssets > 0) {
            if (flagged > 0 || mismatched > 0) {
                overallStatus = 'Discrepant';
            } else if (matched === totalAssets) {
                overallStatus = 'Verified';
            }
        }

        // Count how many total assigned assets the employee has
        const assignedAssets = await Asset.find({
            $or: [
                { 'employee.number': empId },
                { assignedTo: empId }
            ]
        });

        // Group by cycle for history
        const cycleGroups = {};
        verifications.forEach(v => {
            const key = v.cycleId ? v.cycleId.toString() : 'no-cycle';
            if (!cycleGroups[key]) {
                cycleGroups[key] = [];
            }
            cycleGroups[key].push({
                isMatch: v.assetId ? (v.enteredAssetId === v.assetId.assetTag) : false,
                status: v.status
            });
        });

        // Also build session-date groups for backward compatibility
        const sessions = {};
        verifications.forEach(v => {
            const dateKey = v.verificationDate.toISOString().split('T')[0];
            if (!sessions[dateKey]) {
                sessions[dateKey] = [];
            }
            sessions[dateKey].push({
                isMatch: v.assetId ? (v.enteredAssetId === v.assetId.assetTag) : false
            });
        });
        const sessionDates = Object.keys(sessions).sort().reverse();

        res.json({
            employee: {
                empId: employee.empId,
                fullName: employee.fullName,
                department: employee.department,
                email: employee.email
            },
            overallStatus,
            totalAssigned: assignedAssets.length,
            totalVerified: totalAssets,
            matched,
            mismatched,
            flagged,
            latestSessionDate: sessionDates[0] || null,
            assets,
            allSessions: sessionDates.map(date => ({
                date,
                count: sessions[date].length,
                verified: sessions[date].filter(v => v.isMatch).length,
                discrepant: sessions[date].filter(v => !v.isMatch).length
            }))
        });
    } catch (error) {
        console.error('Error fetching employee verification detail:', error);
        res.status(500).json({ message: 'Failed to fetch employee verification detail' });
    }
});

// GET submitted asset IDs for employee in a cycle
router.get('/cycle/:cycleId/employee/:empId/submitted', async (req, res) => {
    try {
        const { cycleId, empId } = req.params;
        
        const verifications = await Verification.find({ cycleId, employeeId: empId }).select('assetId');
        const assetIds = verifications.map(v => v.assetId.toString());
        
        res.json({ assetIds });
    } catch (error) {
        console.error('Error fetching submitted assets:', error);
        res.status(500).json({ message: 'Failed to fetch submitted assets' });
    }
});

module.exports = router;
