
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AssetVerificationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const verifications = [
    { id: 'AST-9042', n: 'MacBook Pro 16"', vb: 'John Doe', d: '2024-03-15', s: 'Verified', sc: 'green' },
    { id: 'AST-8821', n: 'Dell XPS 15', vb: 'Sarah Rose', d: '2024-03-14', s: 'Flagged', sc: 'amber' },
    { id: 'AST-9105', n: 'iPhone 15 Pro', vb: 'Emma Watson', d: '2024-03-12', s: 'Verified', sc: 'green' },
    { id: 'AST-8742', n: 'Logitech MX Master 3', vb: 'Mike Chen', d: '2024-03-10', s: 'Pending', sc: 'blue' },
    { id: 'AST-9210', n: 'Dell UltraSharp 27"', vb: 'Alex Rivera', d: '2024-03-08', s: 'Verified', sc: 'green' },
  ];

  const filteredVerifications = useMemo(() => {
    return verifications.filter(v => 
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.n.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="verification-list" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Verification Logs</h2>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Asset attestation and compliance history</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Search Asset ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <span className="material-symbols-outlined">tune</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">Asset ID</th>
                    <th className="px-6 py-4">Name & Model</th>
                    <th className="px-6 py-4">Verified By</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {filteredVerifications.map((v, i) => (
                    <tr 
                      key={i} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/assets/${v.id}`)}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{v.id}</td>
                      <td className="px-6 py-4 text-sm font-bold">{v.n}</td>
                      <td className="px-6 py-4 text-sm">{v.vb}</td>
                      <td className="px-6 py-4 text-xs text-[#617589]">{v.d}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.sc === 'green' ? 'bg-green-100 text-green-700' :
                          v.sc === 'amber' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{v.s}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredVerifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-[#617589] text-sm italic">
                        No verification logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between text-xs font-medium text-[#617589]">
              <p>Showing {filteredVerifications.length} verifications</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">Prev</button>
                <button className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssetVerificationListPage;
