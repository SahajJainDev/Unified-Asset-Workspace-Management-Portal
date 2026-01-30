const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const seedFloorData = require('./seedFloorData');

require('dotenv').config();

// Require all models to register them with Mongoose
require('./models/Activity');
require('./models/Asset');
require('./models/Desk');
require('./models/Floor');
require('./models/License');
require('./models/Reports');
require('./models/Room');
require('./models/Software');
require('./models/Verification');
require('./models/Workstation');

// Connect Database
connectDB().then(async () => {
  // Seed floor data on startup
  try {
    await seedFloorData();
    console.log('Floor data seeded successfully');
  } catch (error) {
    console.error('Error seeding floor data:', error);
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/floors', require('./routes/floorRoutes'));
app.use('/api/licenses', require('./routes/licenseRoutes'));
app.use('/api/software', require('./routes/softwareRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
