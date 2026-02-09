const express = require('express');
const router = express.Router();
const VerificationCycle = require('../models/VerificationCycle');
const Verification = require('../models/Verification');

// GET active cycle
router.get('/active', async (req, res) => {
    try {
        const activeCycle = await VerificationCycle.findOne({ status: 'active' });
        if (!activeCycle) {
            return res.json(null);
        }
        
        // Count submissions for this cycle
        const submittedEmployees = await Verification.distinct('employeeId', { cycleId: activeCycle._id });
        
        res.json({
            ...activeCycle.toObject(),
            submittedCount: submittedEmployees.length
        });
    } catch (error) {
        console.error('Error fetching active cycle:', error);
        res.status(500).json({ message: 'Failed to fetch active verification cycle' });
    }
});

// GET all cycles (most recent first)
router.get('/', async (req, res) => {
    try {
        const cycles = await VerificationCycle.find().sort({ createdAt: -1 });
        
        // Enrich each cycle with submission count
        const enriched = await Promise.all(cycles.map(async (cycle) => {
            const submittedEmployees = await Verification.distinct('employeeId', { cycleId: cycle._id });
            return {
                ...cycle.toObject(),
                submittedCount: submittedEmployees.length
            };
        }));
        
        res.json(enriched);
    } catch (error) {
        console.error('Error fetching cycles:', error);
        res.status(500).json({ message: 'Failed to fetch verification cycles' });
    }
});

// POST - Start a new verification cycle
router.post('/', async (req, res) => {
    try {
        const { title, createdBy, notes } = req.body;
        
        if (!title || !createdBy) {
            return res.status(400).json({ message: 'Title and createdBy are required' });
        }
        
        // Check if there's already an active cycle
        const existingActive = await VerificationCycle.findOne({ status: 'active' });
        if (existingActive) {
            return res.status(400).json({ 
                message: 'There is already an active verification cycle. Please close it before starting a new one.',
                activeCycle: existingActive
            });
        }
        
        const cycle = new VerificationCycle({
            title,
            createdBy,
            notes: notes || '',
            status: 'active',
            startDate: new Date()
        });
        
        const savedCycle = await cycle.save();
        res.status(201).json(savedCycle);
    } catch (error) {
        console.error('Error creating verification cycle:', error);
        res.status(500).json({ message: 'Failed to create verification cycle' });
    }
});

// PATCH - Close a cycle
router.patch('/:id/close', async (req, res) => {
    try {
        const { closedBy } = req.body;
        
        const cycle = await VerificationCycle.findById(req.params.id);
        if (!cycle) {
            return res.status(404).json({ message: 'Verification cycle not found' });
        }
        
        if (cycle.status === 'closed') {
            return res.status(400).json({ message: 'This cycle is already closed' });
        }
        
        cycle.status = 'closed';
        cycle.endDate = new Date();
        cycle.closedBy = closedBy || 'admin';
        
        const updated = await cycle.save();
        
        // Count submissions
        const submittedEmployees = await Verification.distinct('employeeId', { cycleId: updated._id });
        
        res.json({
            ...updated.toObject(),
            submittedCount: submittedEmployees.length
        });
    } catch (error) {
        console.error('Error closing verification cycle:', error);
        res.status(500).json({ message: 'Failed to close verification cycle' });
    }
});

// GET - Check if an employee has submitted for a specific cycle
router.get('/:id/employee-status/:empId', async (req, res) => {
    try {
        const { id, empId } = req.params;
        
        const existing = await Verification.findOne({ 
            cycleId: id, 
            employeeId: empId 
        });
        
        res.json({ 
            hasSubmitted: !!existing,
            submissionCount: existing ? await Verification.countDocuments({ cycleId: id, employeeId: empId }) : 0
        });
    } catch (error) {
        console.error('Error checking employee status:', error);
        res.status(500).json({ message: 'Failed to check employee verification status' });
    }
});

module.exports = router;
