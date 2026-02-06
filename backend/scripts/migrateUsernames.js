const mongoose = require('mongoose');
const Employee = require('../models/Employee');
require('dotenv').config({ path: '../.env' }); // Adjust path to .env if needed

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trackpro';

async function migrateUsernames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      if (!emp.userName && emp.fullName) {
        emp.userName = emp.fullName.trim().replace(/\s+/g, '.');
        await emp.save();
        updatedCount++;
        // console.log(`Updated: ${emp.fullName} -> ${emp.userName}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`Migration complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrateUsernames();
