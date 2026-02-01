const express = require('express');
const router = express.Router();
const forecastingService = require('../services/forecastingService');
const Asset = require('../models/Asset');

/**
 * @route GET /api/forecast/:assetType
 * @desc Get inventory forecast and metrics for a specific asset type
 * @access Private
 */
router.get('/:assetType', async (req, res) => {
  try {
    const { assetType } = req.params;
    
    // Basic validation
    if (!assetType) {
      return res.status(400).json({ msg: 'Asset type is required' });
    }

    const forecast = await forecastingService.getForecast(assetType);
    
    // Also fetch current stock level for comparison
    const currentStock = await Asset.countDocuments({ 
        assetType: { $regex: new RegExp(assetType, 'i') }, // Case insensitive match
        status: { $in: ['Available', 'STORAGE', 'New'] }
    });

    const totalAssets = await Asset.countDocuments({
        assetType: { $regex: new RegExp(assetType, 'i') }
    });

    res.json({
        ...forecast,
        currentStock,
        totalAssets,
        shouldReorder: forecast.metrics ? currentStock <= forecast.metrics.reorderPoint : false
    });

  } catch (err) {
    console.error('Forecast Route Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
