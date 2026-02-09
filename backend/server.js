const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { connectDB } = require('./config/db');
// Connect Database
connectDB().then(async () => {
  console.log('Database connected');
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/asset-categories', require('./routes/assetCategoryRoutes'));

app.use('/api/forecast', require('./routes/forecastRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// app.use('/api/floors', require('./routes/floorRoutes')); // Removed
app.use('/api/desks', require('./routes/deskRoutes')); // Added
require('./models/Employee');
app.use('/api/licenses', require('./routes/licenseRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes')); // Added
app.use('/api/software', require('./routes/softwareRoutes'));
app.use('/api/verifications', require('./routes/verificationRoutes'));
app.use('/api/verification-cycles', require('./routes/verificationCycleRoutes'));
app.use('/api/software-verification', require('./routes/softwareVerificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/actions', require('./routes/actionRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
