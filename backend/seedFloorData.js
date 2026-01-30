const mongoose = require('mongoose');
const Floor = require('./models/Floor');
const Workstation = require('./models/Workstation');

const seedFloorData = async () => {
  try {
    console.log('Seeding floor data...');

    // Clear existing data
    await Floor.deleteMany({});
    await Workstation.deleteMany({});

    // Sample floors
    const floors = [
      {
        name: 'Ground Floor',
        description: 'Main entrance and reception area',
        building: 'Main Building',
        level: 0,
        isActive: true
      },
      {
        name: 'First Floor',
        description: 'Executive offices and meeting rooms',
        building: 'Main Building',
        level: 1,
        isActive: true
      },
      {
        name: 'Second Floor',
        description: 'Development team workspace',
        building: 'Main Building',
        level: 2,
        isActive: true
      },
      {
        name: 'Third Floor',
        description: 'Design and marketing teams',
        building: 'Main Building',
        level: 3,
        isActive: true
      }
    ];

    const createdFloors = await Floor.insertMany(floors);
    console.log(`Created ${createdFloors.length} floors`);

    // Sample workstations for each floor
    const workstations = [];

    // Ground Floor workstations (A section)
    for (let i = 1; i <= 20; i++) {
      const seatId = `A-${i.toString().padStart(2, '0')}`;
      workstations.push({
        workstationId: seatId,
        seatNumber: seatId,
        floorType: 'A',
        status: i <= 15 ? 'Occupied' : 'Available',
        floor: createdFloors[0]._id,
        assignedEmployeeId: i <= 15 ? ['1306', '1738', '1505', '1330', '1907', '1117'][i % 6] : undefined,
        isActive: true
      });
    }

    // First Floor workstations (B section)
    for (let i = 1; i <= 25; i++) {
      const seatId = `B-${i.toString().padStart(2, '0')}`;
      workstations.push({
        workstationId: seatId,
        seatNumber: seatId,
        floorType: 'B',
        status: i <= 20 ? 'Occupied' : 'Available',
        floor: createdFloors[1]._id,
        assignedEmployeeId: i <= 20 ? ['1306', '1738', '1505', '1330', '1907', '1117'][i % 6] : undefined,
        isActive: true
      });
    }

    // Second Floor workstations (C section)
    for (let i = 1; i <= 30; i++) {
      workstations.push({
        workstationId: `WS-C${i.toString().padStart(3, '0')}`,
        seatNumber: `C-${i.toString().padStart(2, '0')}`,
        floorType: 'C',
        status: i <= 25 ? 'Occupied' : 'Available',
        floor: createdFloors[2]._id,
        assignedEmployeeId: i <= 25 ? ['1306', '1738', '1505', '1330', '1907', '1117'][i % 6] : undefined,
        isActive: true
      });
    }

    // Third Floor workstations (D section)
    for (let i = 1; i <= 20; i++) {
      const seatId = `D-${i.toString().padStart(2, '0')}`;
      workstations.push({
        workstationId: seatId,
        seatNumber: seatId,
        floorType: 'D',
        status: i <= 15 ? 'Occupied' : 'Available',
        floor: createdFloors[3]._id,
        assignedEmployeeId: i <= 15 ? ['1306', '1738', '1505', '1330', '1907', '1117'][i % 6] : undefined,
        isActive: true
      });
    }

    const createdWorkstations = await Workstation.insertMany(workstations);
    console.log(`Created ${createdWorkstations.length} workstations`);

    // Update floors with workstation references
    for (const floor of createdFloors) {
      const floorWorkstations = createdWorkstations.filter(ws => ws.floor.toString() === floor._id.toString());
      await Floor.findByIdAndUpdate(floor._id, {
        workstations: floorWorkstations.map(ws => ws._id)
      });
    }

    console.log('Floor data seeded successfully!');
  } catch (error) {
    console.error('Error seeding floor data:', error);
  }
};

module.exports = seedFloorData;

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/assettrack')
    .then(() => {
      console.log('Connected to MongoDB');
      return seedFloorData();
    })
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
