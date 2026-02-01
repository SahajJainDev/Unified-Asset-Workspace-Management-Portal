const mongoose = require('mongoose');
const Activity = require('./models/Activity');
const Asset = require('./models/Asset');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const seedActivities = async () => {
    try {
        console.log('Seeding historical activities...');
        await Activity.deleteMany({ title: /assigned/i }); // Clear old manual seeds

        const weeks = 20;
        const baseDemand = 10;
        const trend = 0.5; // Slight increase
        const seasonality = [0.8, 1.0, 1.2, 0.9]; // Monthly factor

        for (let i = 0; i < weeks; i++) {
            // Calculate date (going back in time)
            const date = new Date();
            date.setDate(date.getDate() - (weeks - i) * 7);
            
            // Calculate demand with noise
            const seasonFactor = seasonality[i % 4];
            const noise = Math.random() * 4 - 2;
            const demand = Math.round(baseDemand + (i * trend) * seasonFactor + noise);

            console.log(`Week ${i}: ${date.toISOString().split('T')[0]} - Demand: ${demand}`);

            for (let j = 0; j < demand; j++) {
                const activityDate = new Date(date);
                // Distribute across the week
                activityDate.setDate(date.getDate() + Math.floor(Math.random() * 7));

                await Activity.create({
                    title: `Laptop L-${1000 + i * 100 + j} assigned to Employee`,
                    user: 'System Admin',
                    icon: 'computer',
                    color: 'text-blue-500',
                    category: 'asset',
                    timestamp: activityDate,
                    details: 'Laptop assignment'
                });
            }
        }

        console.log('Seeding complete. Run the server and check forecast.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedActivities();
