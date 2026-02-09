import React, { useState, useEffect } from 'react';
import UserSidebar from '../components/UserSidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

const HotDeskBookingPage: React.FC = () => {
    const [availableSeats, setAvailableSeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<any>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slot, setSlot] = useState('Full Day');
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        fetchAvailableSeats();
    }, [date, slot]);

    const fetchAvailableSeats = async () => {
        try {
            setLoading(true);
            const seats = await apiService.getAvailableSeats(date, slot);
            setAvailableSeats(seats);
            setSelectedSeat(null);
        } catch (err: any) {
            console.error('Failed to fetch seats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSeat || !user) return;

        try {
            setBooking(true);
            await apiService.bookHotDesk({
                seatId: selectedSeat._id,
                workstationId: selectedSeat.workstationId,
                employeeId: user.empId,
                employeeName: user.fullName,
                bookingDate: new Date(date),
                timeSlot: slot
            });
            setMessage({ text: `Successfully booked ${selectedSeat.workstationId}!`, type: 'success' });
            fetchAvailableSeats();
        } catch (err: any) {
            setMessage({ text: err.message || 'Booking failed', type: 'error' });
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark">
            <UserSidebar activeTab="hotdesk" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1000px] w-full mx-auto px-6 py-10 animate-in fade-in duration-500">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black tracking-tight">Hot-Desk Booking</h1>
                        <p className="text-[#617589] mt-1">Book a flexible workstation for your hybrid work days.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-[#1a2632] p-6 rounded-[2.5rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Select Slot</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-2 block">Date</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-2 block">Time Slot</label>
                                        <select
                                            value={slot}
                                            onChange={(e) => setSlot(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                                        >
                                            <option>Full Day</option>
                                            <option>Shift A (6AM-2PM)</option>
                                            <option>Shift B (2PM-10PM)</option>
                                            <option>Shift C (10PM-6AM)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {selectedSeat && (
                                <div className="bg-primary p-6 rounded-[2.5rem] text-white animate-in slide-in-from-bottom-4">
                                    <h3 className="text-lg font-black mb-1">Confirm Booking</h3>
                                    <p className="text-blue-100 text-sm mb-6">You are booking {selectedSeat.workstationId} for {date}.</p>
                                    <button
                                        onClick={handleBook}
                                        disabled={booking}
                                        className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {booking ? 'Reserving...' : 'Book Now'}
                                    </button>
                                </div>
                            )}

                            {message.text && (
                                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        {/* Seat Grid */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#1a2632] p-8 rounded-[3rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm min-h-[400px]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold">Available Desks ({availableSeats.length})</h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 bg-primary rounded-full"></div>
                                            <span className="text-[10px] font-bold text-[#617589] uppercase">Selected</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            <span className="text-[10px] font-bold text-[#617589] uppercase">Available</span>
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                ) : availableSeats.length === 0 ? (
                                    <div className="text-center py-20 space-y-4">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
                                        <p className="text-[#617589] font-medium">No available desks for this selection.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {availableSeats.map((seat) => (
                                            <button
                                                key={seat._id}
                                                onClick={() => setSelectedSeat(seat)}
                                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${selectedSeat?._id === seat._id
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl">desk</span>
                                                <span className="text-[9px] font-black uppercase tracking-tighter">{seat.workstationId.split('-').pop()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HotDeskBookingPage;
