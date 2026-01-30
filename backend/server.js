const express = require('express');
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
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// app.use('/api/floors', require('./routes/floorRoutes')); // Removed
app.use('/api/desks', require('./routes/deskRoutes')); // Added
require('./models/Employee');
app.use('/api/licenses', require('./routes/licenseRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes')); // Added
app.use('/api/software', require('./routes/softwareRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
