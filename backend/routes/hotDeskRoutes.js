const express = require('express');
const router = express.Router();
const HotDeskBooking = require('../models/HotDeskBooking');
const Desk = require('../models/Desk');
const { logActivity } = require('../utils/activityLogger');

// GET /api/hotdesk/available-seats?date=YYYY-MM-DD&slot=Full Day
router.get('/available-seats', async (req, res) => {
    try {
        const { date, slot } = req.query;
        if (!date || !slot) {
            return res.status(400).json({ message: "Date and time slot are required" });
        }

        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        // Find all active bookings for this date and slot
        const bookings = await HotDeskBooking.find({
            bookingDate,
            timeSlot: slot,
            status: 'Booked'
        });

        const bookedSeatIds = bookings.map(b => b.seatId.toString());

        // Find all desks that are NOT in the booked list
        // Also ensuring the desk is 'Available' (not permanently assigned)
        const availableDesks = await Desk.find({
            status: 'Available',
            isActive: true,
            _id: { $nin: bookedSeatIds }
        });

        res.json(availableDesks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/hotdesk/book
router.post('/book', async (req, res) => {
    try {
        const { seatId, employeeId, employeeName, bookingDate, timeSlot, bookingType } = req.body;

        if (!seatId || !employeeId || !bookingDate) {
            return res.status(400).json({ message: "Missing required booking details" });
        }

        const bType = bookingType || 'TEMPORARY';
        if (bType === 'TEMPORARY' && !timeSlot) {
            return res.status(400).json({ message: "Time slot is required for temporary bookings" });
        }

        const bDate = new Date(bookingDate);
        bDate.setHours(0, 0, 0, 0);

        // 1. Check if the employee already has a booking for this slot
        const existingUserBooking = await HotDeskBooking.findOne({
            employeeId,
            bookingDate: bDate,
            timeSlot,
            status: 'Booked'
        });

        if (existingUserBooking) {
            return res.status(400).json({ message: "You already have a booking for this date and time slot" });
        }

        // 2. Check if the seat is already booked for this slot
        const existingSeatBooking = await HotDeskBooking.findOne({
            seatId,
            bookingDate: bDate,
            timeSlot,
            status: 'Booked'
        });

        if (existingSeatBooking) {
            return res.status(400).json({ message: "This seat has already been booked by someone else" });
        }

        const seat = await Desk.findById(seatId);
        if (!seat) return res.status(404).json({ message: "Seat not found" });

        const newBooking = new HotDeskBooking({
            seatId,
            workstationId: seat.workstationId,
            employeeId,
            employeeName,
            bookingDate: bDate,
            timeSlot: bType === 'PERMANENT' ? 'Full Day' : timeSlot,
            bookingType: bType
        });

        await newBooking.save();

        // Synchronize Desk status
        seat.status = bType === 'PERMANENT' ? 'Permanently Assigned' : 'Occupied';
        seat.empId = employeeId;
        seat.userName = employeeName;
        await seat.save();

        await logActivity(
            'Hot-Desk Booked',
            `${employeeName} booked seat ${seat.workstationId} for ${bookingDate} (${timeSlot})`,
            'event_seat',
            'bg-blue-50 text-blue-600',
            'reservation'
        );

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/hotdesk/my-bookings/:empId
router.get('/my-bookings/:empId', async (req, res) => {
    try {
        const bookings = await HotDeskBooking.find({ employeeId: req.params.empId })
            .sort({ bookingDate: -1, createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/hotdesk/cancel/:id
router.post('/cancel/:id', async (req, res) => {
    try {
        const booking = await HotDeskBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = 'Cancelled';
        await booking.save();

        // Synchronize Desk status
        const seat = await Desk.findById(booking.seatId);
        if (seat && seat.empId === booking.employeeId) {
            seat.status = 'Available';
            seat.empId = '';
            seat.userName = '';
            await seat.save();
        }

        await logActivity(
            'Hot-Desk Cancelled',
            `${booking.employeeName} cancelled booking for seat ${booking.workstationId} on ${booking.bookingDate.toISOString().split('T')[0]}`,
            'event_busy',
            'bg-orange-50 text-orange-600',
            'reservation'
        );

        res.json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/hotdesk/admin/unassign
router.post('/admin/unassign/:id', async (req, res) => {
    try {
        const seat = await Desk.findById(req.params.id);
        if (!seat) return res.status(404).json({ message: "Seat not found" });

        // Find active booking for this seat
        const booking = await HotDeskBooking.findOne({
            seatId: seat._id,
            status: 'Booked'
        });

        if (booking) {
            booking.status = 'Cancelled';
            await booking.save();
        }

        seat.status = 'Available';
        seat.empId = '';
        seat.userName = '';
        await seat.save();

        await logActivity(
            'Seat Unassigned (Admin)',
            `Seat ${seat.workstationId} was unassigned by Admin. Permanent booking closed.`,
            'person_remove',
            'bg-gray-50 text-gray-600',
            'reservation'
        );

        res.json({ message: "Seat unassigned successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
