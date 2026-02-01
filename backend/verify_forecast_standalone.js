const mongoose = require('mongoose');
const forecastingService = require('./services/forecastingService');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const runVerification = async () => {
    try {
        console.log('Testing Forecasting Service...');
        
        // 1. Get Forecast
        console.log('Fetching forecast for Laptop...');
        const result = await forecastingService.getForecast('Laptop');
        
        console.log('--- Forecast Result ---');
        console.log('Asset Type:', result.assetType);
        console.log('History Points:', result.history.length);
        console.log('Forecast Points:', result.forecast.length);
        console.log('Metrics:', result.metrics);
        
        if (result.forecast.length > 0) {
            console.log('Sample Prediction (Week 1):', result.forecast[0].value);
        } else {
            console.log('No forecast generated (insufficient data?)');
        }

        if (result.metrics && result.metrics.reorderPoint > 0) {
            console.log('SUCCESS: Metrics calculated.');
        } else {
            console.log('WARNING: Metrics missing or zero.');
        }

        process.exit();
    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    }
};

// Wait for connection
mongoose.connection.once('open', () => {
    runVerification();
});
