import React, { useState, useEffect } from 'react';
import UserSidebar from '../components/UserSidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const UserWorkspacePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'permanent' | 'hotdesk' | 'my-bookings'>('permanent');
    const [user, setUser] = useState<any>(null);
    const [desk, setDesk] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [availableSeats, setAvailableSeats] = useState<any[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<any>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slot, setSlot] = useState('Full Day');
    const [bookingType, setBookingType] = useState<'TEMPORARY' | 'PERMANENT'>('TEMPORARY');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchPermanentDesk(userData.empId);
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'hotdesk') {
            fetchAvailableSeats();
        } else if (activeTab === 'my-bookings' && user) {
            fetchMyBookings(user.empId);
        }
    }, [activeTab, date, slot, user, bookingType]); // Added bookingType to dependencies

    const fetchPermanentDesk = async (empId: string) => {
        try {
            setLoading(true);
            const deskData = await apiService.getDeskByEmployee(empId);
            setDesk(deskData);
        } catch (err) {
            console.log("No permanent desk found");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSeats = async () => {
        try {
            setBookingLoading(true);
            // For available seats, we still use date/slot for Temporary, or just fetch for Permanent
            // To simplify, we'll use the same API as it filters out existing bookings
            const seats = await apiService.getAvailableSeats(date, slot, bookingType); // Pass bookingType
            setAvailableSeats(seats);
            setSelectedSeat(null);
        } catch (err) {
            console.error('Failed to fetch seats:', err);
        } finally {
            setBookingLoading(false);
        }
    };

    const fetchMyBookings = async (empId: string) => {
        try {
            setBookingsLoading(true);
            const data = await apiService.getMyHotDeskBookings(empId);
            setMyBookings(data);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
        } finally {
            setBookingsLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSeat || !user) return;
        try {
            setBookingLoading(true);
            await apiService.bookHotDesk({
                seatId: selectedSeat._id,
                workstationId: selectedSeat.workstationId,
                employeeId: user.empId,
                employeeName: user.fullName,
                bookingDate: new Date(date),
                timeSlot: bookingType === 'PERMANENT' ? 'Full Day' : slot,
                bookingType: bookingType
            });
            setMessage({ text: `Successfully booked ${selectedSeat.workstationId} as ${bookingType.toLowerCase()}!`, type: 'success' });
            fetchAvailableSeats();
        } catch (err: any) {
            setMessage({ text: err.message || 'Booking failed', type: 'error' });
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await apiService.cancelHotDeskBooking(id);
            if (user) fetchMyBookings(user.empId);
        } catch (err) {
            alert('Failed to cancel booking');
        }
    };

    const tabs = [
        { id: 'permanent', label: 'My Workstation', icon: 'desk' },
        { id: 'hotdesk', label: 'Book Hot-Desk', icon: 'nest_multi_room' },
        { id: 'my-bookings', label: 'My Reservations', icon: 'calendar_today' },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <UserSidebar activeTab="seat" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1000px] w-full px-10 py-10 animate-in fade-in duration-500">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black tracking-tight">Seat Management</h1>
                        <p className="text-[#617589] mt-2">Manage your workstation and temporary bookings.</p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 p-1.5 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 rounded-3xl mb-8 w-fit shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-[#617589] hover:bg-slate-50 dark:hover:bg-slate-900'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'permanent' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-[#1a2632] rounded-[2.5rem] border border-[#dbe0e6] dark:border-gray-800 shadow-xl overflow-hidden">
                                        <div className="p-8 border-b border-slate-50 dark:border-gray-800">
                                            <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">YOUR ASSIGNED WORKSTATION</p>
                                            <h2 className="text-5xl font-black text-primary">{desk?.workstationId || 'Not Assigned'}</h2>
                                        </div>
                                        <div className="p-8 space-y-8">
                                            <div className="flex flex-wrap gap-8">
                                                <div>
                                                    <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">ZONE</p>
                                                    <p className="font-bold text-lg">{desk ? `Block ${desk.block}` : '---'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">DEPARTMENT</p>
                                                    <p className="font-bold text-lg">{user?.department || 'General'}</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined">info</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">This is your permanent seat. For changes, contact operations.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <div className="bg-white dark:bg-[#1a2632] p-8 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm h-full flex flex-col items-center justify-center text-center">
                                        <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-4">
                                            <span className="material-symbols-outlined text-4xl">location_on</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Location View</h3>
                                        <p className="text-sm text-[#617589] font-medium leading-relaxed">Your desk is located in Block {desk?.block || '---'}. View the full floor map for details.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hotdesk' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="bg-white dark:bg-[#1a2632] p-6 rounded-[2.5rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Booking Details</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-2 block">Booking Type</label>
                                                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                                    <button
                                                        onClick={() => setBookingType('TEMPORARY')}
                                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bookingType === 'TEMPORARY' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-[#617589]'}`}
                                                    >
                                                        Hot-Desk
                                                    </button>
                                                    <button
                                                        onClick={() => setBookingType('PERMANENT')}
                                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bookingType === 'PERMANENT' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-[#617589]'}`}
                                                    >
                                                        Permanent
                                                    </button>
                                                </div>
                                            </div>

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

                                            {bookingType === 'TEMPORARY' && (
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
                                            )}
                                        </div>
                                    </div>

                                    {selectedSeat && (
                                        <div className="bg-primary p-6 rounded-[2.5rem] text-white">
                                            <h3 className="text-lg font-black mb-1">Confirm</h3>
                                            <p className="text-blue-100 text-sm mb-6">Booking {selectedSeat.workstationId} {bookingType === 'PERMANENT' ? 'Permanently' : `(Slot: ${slot})`}</p>
                                            <button
                                                onClick={handleBook}
                                                disabled={bookingLoading}
                                                className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                            >
                                                {bookingLoading ? '...' : 'Book Now'}
                                            </button>
                                        </div>
                                    )}

                                    {message.text && (
                                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                            {message.text}
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-[#1a2632] p-8 rounded-[3rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm min-h-[400px]">
                                        <h3 className="text-xl font-bold mb-6">Available Desks ({availableSeats.length})</h3>
                                        {bookingLoading ? (
                                            <div className="flex items-center justify-center py-20 animate-spin text-primary"><span className="material-symbols-outlined">refresh</span></div>
                                        ) : (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                                {availableSeats.map((seat) => (
                                                    <button
                                                        key={seat._id}
                                                        onClick={() => setSelectedSeat(seat)}
                                                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${selectedSeat?._id === seat._id
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <span className="text-[9px] font-black">{seat.workstationId.split('-').pop()}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'my-bookings' && (
                            <div className="space-y-4">
                                {bookingsLoading ? (
                                    <div className="text-center py-20 text-[#617589]">Loading reservations...</div>
                                ) : myBookings.length === 0 ? (
                                    <div className="bg-white dark:bg-[#1a2632] p-12 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 text-center space-y-4">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">calendar_today</span>
                                        <p className="text-[#617589] font-medium">You have no active hot-desk reservations.</p>
                                    </div>
                                ) : (
                                    myBookings.map((booking) => (
                                        <div key={booking._id} className="bg-white dark:bg-[#1a2632] p-3 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={`size-10 rounded-2xl flex items-center justify-center ${booking.status === 'Cancelled' ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                                    <span className="material-symbols-outlined text-2xl">desk</span>
                                                </div>
                                                <div>
                                                    <div>
                                                        <h3 className="text-[12px] font-black">{booking.workstationId}</h3>
                                                        <p className="text-[10px] font-bold text-[#617589]">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${booking.bookingType === 'PERMANENT' ? 'bg-indigo-50 text-indigo-700' : 'bg-primary/5 text-primary'}`}>
                                                                {booking.bookingType || 'HOT-DESK'}
                                                            </span>
                                                            {booking.bookingType !== 'PERMANENT' && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#617589] bg-slate-50 px-2 py-0.5 rounded-full">{booking.timeSlot}</span>
                                                            )}
                                                            {booking.status === 'Cancelled' && <span className="text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Cancelled</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {booking.status === 'Booked' && new Date(booking.bookingDate) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                                                <button onClick={() => handleCancel(booking._id)} className="px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserWorkspacePage;
