import React, { useState, useEffect } from 'react';
import UserSidebar from '../components/UserSidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

const MyHotDeskBookings: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchBookings(userData.empId);
        }
    }, []);

    const fetchBookings = async (empId: string) => {
        try {
            setLoading(true);
            const data = await apiService.getMyHotDeskBookings(empId);
            setBookings(data);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await apiService.cancelHotDeskBooking(id);
            if (user) fetchBookings(user.empId);
        } catch (err) {
            alert('Failed to cancel booking');
        }
    };

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark">
            <UserSidebar activeTab="my-bookings" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1000px] w-full mx-auto px-6 py-10">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black tracking-tight">My Bookings</h1>
                        <p className="text-[#617589] mt-1">Manage your upcoming and past hot-desk reservations.</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-[#617589]">Loading your bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="bg-white dark:bg-[#1a2632] p-12 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 text-center space-y-4">
                            <span className="material-symbols-outlined text-4xl text-gray-300">calendar_today</span>
                            <h3 className="text-xl font-bold">No Bookings Found</h3>
                            <p className="text-[#617589]">You haven't made any hot-desk bookings yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="bg-white dark:bg-[#1a2632] p-6 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center ${booking.status === 'Cancelled' ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
                                            }`}>
                                            <span className="material-symbols-outlined text-3xl">desk</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black">{booking.workstationId}</h3>
                                            <p className="text-sm font-bold text-[#617589]">
                                                {new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">{booking.timeSlot}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${booking.status === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.status === 'Booked' && new Date(booking.bookingDate) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            className="px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyHotDeskBookings;
