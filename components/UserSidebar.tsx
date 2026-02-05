
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface UserSidebarProps {
  activeTab?: 'verify' | 'seat';
}

const UserSidebar: React.FC<UserSidebarProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'verify', label: 'Verify Asset', icon: 'fact_check', path: '/user/verify' },
    { id: 'seat', label: 'Seat Allocation', icon: 'event_seat', path: '/user/seat' },
  ];

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const currentTab = activeTab || (location.pathname.includes('seat') ? 'seat' : 'verify');

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen bg-white dark:bg-[#1a2632] border-r border-[#dbe0e6] dark:border-gray-800 transition-colors z-20">
      <div className="p-6 flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/user/verify')}>
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
          <span className="material-symbols-outlined">person</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight">Employee Portal</h2>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentTab === item.id
              ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/20 scale-[1.02]'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-[#617589] dark:text-gray-400'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-[#dbe0e6] dark:border-gray-800 shrink-0 bg-white dark:bg-[#1a2632]">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer group"
        >
          <div
            className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20 shadow-inner shrink-0 flex items-center justify-center bg-gray-50 text-primary group-hover:bg-red-500 group-hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{currentUser.fullName || 'Guest User'}</p>
            <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">ID: {currentUser.empId || '---'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default UserSidebar;
