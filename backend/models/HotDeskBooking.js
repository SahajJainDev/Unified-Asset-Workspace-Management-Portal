const mongoose = require('mongoose');

const hotDeskBookingSchema = new mongoose.Schema({
    seatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Desk',
        required: true
    },
    workstationId: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        enum: ['Full Day', 'Shift A (6AM-2PM)', 'Shift B (2PM-10PM)', 'Shift C (10PM-6AM)'],
        required: function () { return this.bookingType === 'TEMPORARY'; },
        default: 'Full Day'
    },
    bookingType: {
        type: String,
        enum: ['TEMPORARY', 'PERMANENT'],
        default: 'TEMPORARY'
    },
    status: {
        type: String,
        enum: ['Booked', 'Cancelled', 'Completed'],
        default: 'Booked'
    },
    bookedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient lookup and conflict prevention
hotDeskBookingSchema.index({ bookingDate: 1, workstationId: 1, timeSlot: 1, status: 1 });
hotDeskBookingSchema.index({ employeeId: 1, bookingDate: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('HotDeskBooking', hotDeskBookingSchema);
