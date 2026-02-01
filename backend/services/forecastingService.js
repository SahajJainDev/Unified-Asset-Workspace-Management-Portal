const tf = require('@tensorflow/tfjs');
const Activity = require('../models/Activity');
const Asset = require('../models/Asset');

// Cache forecasts in memory to avoid retraining on every request
const CACHE_TTL = 3600 * 1000; // 1 hour
const forecastCache = new Map();

/**
 * Prepares historical usage data from Activity logs
 * @param {string} assetType - Type of asset to forecast (e.g., 'Laptop')
 * @returns {Promise<Array<{date: string, count: number}>>}
 */
async function getHistoricalUsage(assetType) {
  // 1. Get all assets of this type to filter activities if needed, 
  // or primarily rely on the activity details/title.
  // For simplicity, we assume activities for 'asset' category represents usage/assignment.
  
  // Find all assignment activities
  const activities = await Activity.find({
    category: 'asset',
    title: { $regex: /assigned/i } // Simple heuristic for demand
  }).sort({ timestamp: 1 });

  // Group by week
  const weeklyUsage = {};
  
  activities.forEach(activity => {
    // If we had assetType available in activity, we'd filter here.
    // For now, assume global asset demand or try to parse.
    // In a real app, we'd query by specific asset IDs or type.
    // Let's assume the forecast is for the general category if not specified in activity.
    // This is a simplification. Ideally Activity has 'assetType'. 
    // We will parse 'Laptop', 'Monitor' from title if possible or match with Asset DB.
    
    // Simple parsing logic: Check if title contains the assetType
    if (assetType && !activity.title.toLowerCase().includes(assetType.toLowerCase()) && 
        !activity.details.toLowerCase().includes(assetType.toLowerCase())) {
        return;
    }

    const date = new Date(activity.timestamp);
    // Get start of week (Sunday)
    const day = date.getDay();
    const diff = date.getDate() - day; 
    const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
    
    weeklyUsage[weekStart] = (weeklyUsage[weekStart] || 0) + 1;
  });

  // Fill in missing weeks (gaps) with 0
  const sortedWeeks = Object.keys(weeklyUsage).sort();
  if (sortedWeeks.length < 2) return []; // Not enough data

  const startDate = new Date(sortedWeeks[0]);
  const endDate = new Date(sortedWeeks[sortedWeeks.length - 1]);
  const usageData = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const weekStr = d.toISOString().split('T')[0];
    usageData.push({
      date: weekStr,
      count: weeklyUsage[weekStr] || 0
    });
  }

  return usageData;
}

/**
 * Trains a simple LSTM model for forecasting
 * @param {Array<number>} data - Time series data
 * @returns {Promise<tf.LayersModel>}
 */
async function trainModel(data) {
  const windowSize = 4; // Look back 4 weeks
  if (data.length < windowSize + 2) return null; // Not enough data

  // Normalize data (Min-Max scaling)
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const normalizedData = data.map(v => (v - minVal) / (maxVal - minVal || 1));

  // Create training sets
  const inputs = [];
  const labels = [];

  for (let i = 0; i < normalizedData.length - windowSize; i++) {
    inputs.push(normalizedData.slice(i, i + windowSize));
    labels.push(normalizedData[i + windowSize]);
  }

  const inputTensor = tf.tensor2d(inputs, [inputs.length, windowSize]);
  const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
  
  // Reshape for LSTM: [samples, timeSteps, features]
  const inputReshaped = inputTensor.reshape([inputs.length, windowSize, 1]);

  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 30,
    inputShape: [windowSize, 1],
    returnSequences: false
  }));
  model.add(tf.layers.dense({ units: 1, activation: 'relu' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError'
  });

  await model.fit(inputReshaped, labelTensor, {
    epochs: 50,
    batchSize: 4,
    shuffle: true,
    verbose: 0
  });

  inputTensor.dispose();
  labelTensor.dispose();
  inputReshaped.dispose();

  return { model, minVal, maxVal, windowSize };
}

/**
 * Calculates safety stock and reorder points
 * @param {Array<number>} data - Annual/Historical data
 */
function calculateInventoryMetrics(data) {
  if (!data || data.length === 0) return null;

  // Calculate Average Demand (per week)
  const sum = data.reduce((a, b) => a + b, 0);
  const avgDemand = sum / data.length;

  // Calculate Standard Deviation
  const squareDiffs = data.map(value => Math.pow(value - avgDemand, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Assumptions
  const leadTimeWeeks = 1; // 7 days
  const serviceLevelZ = 1.65; // 95% service level

  const safetyStock = Math.ceil(serviceLevelZ * stdDev * Math.sqrt(leadTimeWeeks));
  const reorderPoint = Math.ceil((avgDemand * leadTimeWeeks) + safetyStock);

  return {
    avgDemand: parseFloat(avgDemand.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    safetyStock,
    reorderPoint
  };
}

/**
 * Main service function to get forecast
 */
exports.getForecast = async (assetType) => {
  const cacheKey = `forecast_${assetType}`;
  const cached = forecastCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const historicalData = await getHistoricalUsage(assetType);
    const counts = historicalData.map(d => d.count);
    
    const inventoryMetrics = calculateInventoryMetrics(counts);
    let forecastValues = [];
    
    // If not enough data for ML, use simple moving average or just return history
    const trainingResult = await trainModel(counts);
    
    if (trainingResult) {
      const { model, minVal, maxVal, windowSize } = trainingResult;
      
      // Predict next 4 weeks
      let lastInput = counts.slice(-windowSize);
      let normalizedInput = lastInput.map(v => (v - minVal) / (maxVal - minVal || 1));
      
      for (let i = 0; i < 4; i++) {
        const inputTensor = tf.tensor2d([normalizedInput], [1, windowSize]);
        const inputReshaped = inputTensor.reshape([1, windowSize, 1]);
        
        const prediction = model.predict(inputReshaped);
        const predValue = prediction.dataSync()[0];
        
        // Denormalize
        const realValue = Math.max(0, Math.round((predValue * (maxVal - minVal)) + minVal));
        forecastValues.push({ week: i + 1, value: realValue });
        
        // Setup next input (slide window)
        normalizedInput.shift();
        normalizedInput.push(predValue);
        
        inputTensor.dispose();
        inputReshaped.dispose();
        prediction.dispose();
        // In TFJS node, manual disposal is less critical for small tensors but good practice.
      }
      // Clean up model
      model.dispose();
    } else {
        // Fallback: Use average for next 4 weeks if not enough data
        const avg = inventoryMetrics ? inventoryMetrics.avgDemand : 0;
        forecastValues = Array(4).fill(0).map((_, i) => ({ week: i + 1, value: Math.round(avg) }));
    }

    const result = {
      assetType,
      history: historicalData,
      forecast: forecastValues,
      metrics: inventoryMetrics,
      generatedAt: new Date()
    };

    forecastCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;

  } catch (error) {
    console.error('Forecasting error:', error);
    throw error;
  }
};
