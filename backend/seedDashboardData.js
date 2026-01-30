const mongoose = require('mongoose');
const Desk = require('./models/Desk');
const Verification = require('./models/Verification');
const Activity = require('./models/Activity');
require('dotenv').config();

const seedDashboardData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/assettrack');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Desk.deleteMany({});
    await Verification.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing dashboard data');

    // Seed Desk data
    const deskData = [
      // Occupied desks (425)
      ...Array.from({ length: 425 }, (_, i) => ({
        status: 'Occupied',
        deskId: `D${String(i + 1).padStart(3, '0')}`,
        location: `Floor ${Math.floor(i / 100) + 1}`,
        assignedTo: `Employee ${i + 1}`,
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last week
      })),
      // Available desks (50)
      ...Array.from({ length: 50 }, (_, i) => ({
        status: 'Available',
        deskId: `A${String(i + 1).padStart(3, '0')}`,
        location: `Floor ${Math.floor((i + 425) / 100) + 1}`,
        assignedTo: null,
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      })),
      // Reserved desks (25)
      ...Array.from({ length: 25 }, (_, i) => ({
        status: 'Reserved',
        deskId: `R${String(i + 1).padStart(3, '0')}`,
        location: `Floor ${Math.floor((i + 475) / 100) + 1}`,
        assignedTo: `Reserved for Employee ${i + 1}`,
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }))
    ];

    await Desk.insertMany(deskData);
    console.log(`Seeded ${deskData.length} desk records`);

    // Seed Verification data
    const verificationData = [
      // Verified assets (850)
      ...Array.from({ length: 850 }, (_, i) => ({
        assetId: new mongoose.Types.ObjectId(), // Mock asset IDs
        status: 'Verified',
        verifiedBy: `Verifier ${i % 10 + 1}`,
        verificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within last 30 days
        notes: 'Verification completed successfully',
        lastUpdated: new Date()
      })),
      // Pending verifications (120)
      ...Array.from({ length: 120 }, (_, i) => ({
        assetId: new mongoose.Types.ObjectId(),
        status: 'Pending',
        verifiedBy: `Verifier ${(i + 850) % 10 + 1}`,
        verificationDate: null,
        notes: 'Awaiting verification',
        lastUpdated: new Date()
      })),
      // Flagged assets (45)
      ...Array.from({ length: 45 }, (_, i) => ({
        assetId: new mongoose.Types.ObjectId(),
        status: 'Flagged',
        verifiedBy: `Verifier ${(i + 970) % 10 + 1}`,
        verificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        notes: 'Issues found during verification',
        lastUpdated: new Date()
      }))
    ];

    await Verification.insertMany(verificationData);
    console.log(`Seeded ${verificationData.length} verification records`);

    // Seed Activity data
    const activityData = [
      {
        title: 'MacBook Pro assigned',
        user: 'Assigned to Sarah Jenkins (Design)',
        icon: 'laptop_mac',
        color: 'bg-blue-50 text-blue-600',
        category: 'asset',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        details: 'MacBook Pro 16" assigned to Sarah Jenkins in Design department'
      },
      {
        title: 'License Expired',
        user: 'Adobe Creative Cloud (10 seats)',
        icon: 'warning',
        color: 'bg-amber-50 text-amber-600',
        category: 'license',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        details: 'Adobe Creative Cloud license expired for 10 seats'
      },
      {
        title: 'Maintenance Complete',
        user: 'Server Room B cooling system check',
        icon: 'check_circle',
        color: 'bg-emerald-50 text-emerald-600',
        category: 'maintenance',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        details: 'Completed maintenance check on Server Room B cooling system'
      },
      {
        title: 'Desk Reservation',
        user: 'Mike Ross reserved Desk 4B-12',
        icon: 'event_seat',
        color: 'bg-purple-50 text-purple-600',
        category: 'reservation',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        details: 'Mike Ross reserved Desk 4B-12 for tomorrow'
      },
      {
        title: 'Policy Update',
        user: 'Remote Work Equipment Policy v2.1',
        icon: 'description',
        color: 'bg-slate-50 text-slate-600',
        category: 'policy',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        details: 'Updated Remote Work Equipment Policy to version 2.1'
      }
    ];

    await Activity.insertMany(activityData);
    console.log(`Seeded ${activityData.length} activity records`);

    console.log('Dashboard data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
if (require.main === module) {
  seedDashboardData();
}

module.exports = seedDashboardData;
