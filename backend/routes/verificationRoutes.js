const express = require('express');
const router = express.Router();
const Verification = require('../models/Verification');
const Asset = require('../models/Asset');

// POST a new verification
router.post('/', async (req, res) => {
    try {
        const { assetId, status, verifiedBy, notes } = req.body;

        // Create verification log
        const verification = new Verification({
            assetId,
            status,
            verifiedBy,
            notes
        });

        const savedVerification = await verification.save();

        // Update asset's verification status if needed
        // Assuming Asset might have a verification status, but let's stick to the log for now.

        res.status(201).json(savedVerification);
    } catch (error) {
        console.error('Error saving verification:', error);
        res.status(500).json({ message: 'Failed to save verification' });
    }
});

// GET all verifications (filtered or all)
router.get('/', async (req, res) => {
    try {
        // Populate assetId to get asset details (name, assetTag)
        const verifications = await Verification.find()
            .populate('assetId', 'assetName assetTag')
            .sort({ verificationDate: -1 });

        // Format for the frontend
        const formatted = verifications.map(v => ({
            id: v.assetId ? v.assetId.assetTag : 'N/A',
            n: v.assetId ? v.assetId.assetName : 'Unknown Asset',
            vb: v.verifiedBy,
            d: v.verificationDate.toISOString().split('T')[0],
            s: v.status,
            sc: v.status === 'Verified' ? 'green' : v.status === 'Flagged' ? 'amber' : 'blue'
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        res.status(500).json({ message: 'Failed to fetch verifications' });
    }
});

module.exports = router;
