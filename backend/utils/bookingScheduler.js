const cron = require('node-cron');
const HotDeskBooking = require('../models/HotDeskBooking');
const Desk = require('../models/Desk');
const { logActivity } = require('./activityLogger');

/**
 * Maps time slot strings to their end hours (approximate for detection)
 */
const SLOT_END_HOURS = {
    'Full Day': 20, // 8 PM
    'Shift A (6AM-2PM)': 14, // 2 PM
    'Shift B (2PM-10PM)': 22, // 10 PM
    'Shift C (10PM-6AM)': 6,  // 6 AM next day
};

const startBookingScheduler = () => {
    // Run every 30 minutes
    cron.schedule('0,30 * * * *', async () => {
        console.log('[Scheduler] Checking for completed hot-desk bookings...');
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const today = new Date(now.setHours(0, 0, 0, 0));

            // Find all active TEMPORARY bookings for today or earlier
            const activeBookings = await HotDeskBooking.find({
                status: 'Booked',
                bookingType: 'TEMPORARY',
                bookingDate: { $lte: today }
            });

            for (const booking of activeBookings) {
                const endHour = SLOT_END_HOURS[booking.timeSlot] || 24;
                const isPastDate = booking.bookingDate < today;
                const isPastHour = booking.bookingDate.getTime() === today.getTime() && currentHour >= endHour;

                if (isPastDate || isPastHour) {
                    console.log(`[Scheduler] Marking booking ${booking._id} as completed`);
                    booking.status = 'Completed';
                    await booking.save();

                    // Revert Desk status if this was the last active assignment
                    const seat = await Desk.findById(booking.seatId);
                    if (seat && seat.empId === booking.employeeId) {
                        seat.status = 'Available';
                        seat.empId = '';
                        seat.userName = '';
                        await seat.save();

                        await logActivity(
                            'Seat Released',
                            `Seat ${seat.workstationId} released after hot-desk completion for ${booking.employeeName}`,
                            'desk',
                            'bg-green-50 text-green-600',
                            'reservation'
                        );
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error processing bookings:', error);
        }
    });
};

module.exports = { startBookingScheduler };
