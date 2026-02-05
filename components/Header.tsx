
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef<HTMLDivElement>(null);

  const isUserPath = location.pathname.startsWith('/user');

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDark = () => {
    const newMode = !isDark;
    document.documentElement.classList.toggle('dark');
    setIsDark(newMode);
  };

  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const employeeNotifications = [
    {
      id: 1,
      title: 'Seat Allocation Updated',
      message: 'Your primary workstation allocation has been confirmed by Facilities.',
      time: 'Just now',
      icon: 'event_seat',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 2,
      title: 'Verification Request',
      message: 'System Administrator requested your quarterly asset attestation.',
      time: '2 hours ago',
      icon: 'fact_check',
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#1a2632] border-b border-[#dbe0e6] dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border-none rounded-lg focus:ring-2 focus:ring-primary text-sm transition-all"
            placeholder="Search assets, users, or licenses..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-8">
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          title="Toggle Dark Mode"
        >
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative group transition-colors ${showNotifications ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2632]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1a2632] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-black text-sm uppercase tracking-widest">Notifications</h3>
                <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">2 New</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {(isUserPath ? employeeNotifications : []).map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 dark:border-gray-800/30">
                    <div className="flex gap-4">
                      <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${notif.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-black truncate">{notif.title}</p>
                          <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#617589] mt-1 leading-normal">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!isUserPath && (
                  <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">notifications_off</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No new alerts</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/30 text-center">
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Mark all as read</button>
              </div>
            </div>
          )}
        </div>

        {!isUserPath && (
          <Link
            to="/verification-list"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Compliance Check"
          >
            <span className="material-symbols-outlined">fact_check</span>
          </Link>
        )}

        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-lg">help</span>
            <span className="text-sm font-medium">Help</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
