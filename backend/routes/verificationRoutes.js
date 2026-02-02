const express = require('express');
const router = express.Router();
const Verification = require('../models/Verification');
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');

// POST a new verification
router.post('/', async (req, res) => {
    try {
        const { assetId, enteredAssetId, employeeId, status, notes } = req.body;

        // Fetch Employee name from DB using employeeId
        const employee = await Employee.findOne({ empId: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Create verification log
        const verification = new Verification({
            assetId,
            enteredAssetId,
            employeeId,
            employeeName: employee.fullName,
            status,
            notes
        });

        const savedVerification = await verification.save();
        res.status(201).json(savedVerification);
    } catch (error) {
        console.error('Error saving verification:', error);
        res.status(500).json({ message: 'Failed to save verification' });
    }
});

// GET all verifications (filtered or all)
router.get('/', async (req, res) => {
    try {
        // Populate assetId to get asset details
        const verifications = await Verification.find()
            .populate('assetId', 'assetName assetTag')
            .sort({ verificationDate: -1 });

        // Format for the frontend admin list
        const formatted = verifications.map(v => ({
            id: v.assetId ? v.assetId._id : '',
            assetTag: v.assetId ? v.assetId.assetTag : 'N/A',
            enteredAssetId: v.enteredAssetId,
            assetName: v.assetId ? v.assetId.assetName : 'Unknown Asset',
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

module.exports = router;
