
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import { QuikrLog } from '../types';

export const QUIKR_LOGS_DATA: QuikrLog[] = [
  { id: 'LOG-001', assetId: 'AST-9042', modification: 'Battery health updated to 94% via auto-scan', modifiedBy: 'Quikr Agent v2.4', timestamp: '2024-03-20 09:15 AM' },
  { id: 'LOG-002', assetId: 'AST-8821', modification: 'New software detected: VS Code v1.86.1', modifiedBy: 'Quikr Agent v2.4', timestamp: '2024-03-19 04:30 PM' },
  { id: 'LOG-003', assetId: 'AST-9105', modification: 'Security patch compliance status: Secured', modifiedBy: 'Quikr Agent v2.4', timestamp: '2024-03-19 11:20 AM' },
  { id: 'LOG-004', assetId: 'AST-8742', modification: 'Peripheral connectivity check: PASS', modifiedBy: 'Quikr Agent v2.4', timestamp: '2024-03-18 02:00 PM' },
  { id: 'LOG-005', assetId: 'AST-9210', modification: 'Firmware update v1.0.4 applied successfully', modifiedBy: 'Quikr Agent v2.4', timestamp: '2024-03-18 08:45 AM' },
];

const QuikrLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return QUIKR_LOGS_DATA.filter(log => 
      log.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.modification.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="quikr-logs" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary text-3xl font-black">bolt</span>
                <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Quikr Logs</h2>
              </div>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Automated system modifications and audit trail</p>
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
                  placeholder="Search Asset ID or modification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">Asset ID</th>
                    <th className="px-6 py-4">Modification Details</th>
                    <th className="px-6 py-4">Modified By</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {filteredLogs.map((log, i) => (
                    <tr 
                      key={i} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/assets/${log.assetId}`)}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{log.assetId}</td>
                      <td className="px-6 py-4 text-sm font-medium">{log.modification}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {log.modifiedBy}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#617589]">{log.timestamp}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-[#617589] text-sm italic">
                        No logs matching your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>
    </div>
  );
};

export default QuikrLogsPage;
