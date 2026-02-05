
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activeTab?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { id: 'assets', label: 'Assets', icon: 'laptop_mac', path: '/assets' },
    { id: 'map', label: 'Floor Map', icon: 'map', path: '/map' },
    { id: 'employees', label: 'Employees', icon: 'badge', path: '/employees' },
    { id: 'users', label: 'Users', icon: 'group', path: '/users' },
    { id: 'verification-list', label: 'Asset Verification', icon: 'fact_check', path: '/verification-list' },
    { id: 'software-verifications', label: 'Software Verification', icon: 'inventory_2', path: '/software-verifications' },
    { id: 'quikr-logs', label: 'Quikr Logs', icon: 'bolt', path: '/quikr-logs' },
    { id: 'software', label: 'Software', icon: 'package_2', path: '/software' },
    { id: 'reports', label: 'Reports', icon: 'monitoring', path: '/reports' },
  ];

  const currentTab = activeTab || navItems.find(item => item.path === location.pathname)?.id || 'dashboard';

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen bg-white dark:bg-[#1a2632] border-r border-[#dbe0e6] dark:border-gray-800 transition-colors z-20">
      <div className="p-6 flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight">AssetTrack Pro</h2>
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

      {/* Profile Section - Always Displayed at Bottom */}
      <div className="p-4 mt-auto border-t border-[#dbe0e6] dark:border-gray-800 shrink-0 bg-white dark:bg-[#1a2632]">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
          <div
            className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20 shadow-inner shrink-0"
            style={{ backgroundImage: 'url("https://picsum.photos/seed/admin/100/100")' }}
          ></div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">IT Administrator</p>
            <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">System Management</p>
          </div>
          <span className="material-symbols-outlined ml-auto text-slate-300 text-lg group-hover:text-primary transition-colors">settings</span>
        </div>
        <Link
          to="/upload"
          className="w-full py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-[0.98] active:scale-95 uppercase tracking-widest shadow-xl"
        >
          <span className="material-symbols-outlined text-sm font-black">upload</span>
          Bulk Import
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
