import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const reports = [
    { t: 'Audit Report', d: 'Full compliance check across all office locations and remote staff.', i: 'verified_user', s: 'Up to Date', c: 'blue', active: true, path: '/reports/audit' },
    { t: 'Financial Assets', d: 'Track hardware expenditures, depreciation schedules, and tax reports.', i: 'receipt_long', s: 'Upcoming', c: 'green', active: false },
    { t: 'Utilization Score', d: 'Desk and meeting room occupancy trends & hardware efficiency scores.', i: 'meeting_room', s: 'Upcoming', c: 'amber', active: false },
    { t: 'Security Compliance', d: 'Status of encryption, anti-virus, and security patch levels across fleet.', i: 'security', s: 'Upcoming', c: 'red', active: false },
    { t: 'Inventory Forecast', d: 'Predictive modeling for hardware refresh cycles based on age.', i: 'timeline', s: 'Upcoming', c: 'indigo', active: false },
    { t: 'Vendor Performance', d: 'SLA tracking for support and hardware delivery from main vendors.', i: 'store', s: 'Upcoming', c: 'purple', active: false },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="reports" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black">Advanced Reports</h1>
              <p className="text-[#617589]">Centralized dashboard for utilization, compliance, and financial data.</p>
            </div>
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((rep, i) => (
              <div
                key={i}
                className={`relative bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 flex flex-col h-72 transition-all group ${
                  rep.active
                    ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                    : 'opacity-60 cursor-default'
                }`}
                onClick={() => {
                  if (rep.active && rep.path) navigate(rep.path);
                }}
              >
                {/* Upcoming badge overlay */}
                {!rep.active && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${rep.active ? 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'} transition-colors`}>
                    <span className="material-symbols-outlined">{rep.i}</span>
                  </div>
                  {rep.active && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                      rep.c === 'blue' ? 'bg-blue-100 text-blue-700' :
                      rep.c === 'green' ? 'bg-green-100 text-green-700' :
                      rep.c === 'red' ? 'bg-red-100 text-red-700' :
                      rep.c === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>{rep.s}</span>
                  )}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${rep.active ? 'group-hover:text-primary' : 'text-gray-400 dark:text-gray-500'} transition-colors`}>{rep.t}</h3>
                <p className={`text-sm flex-grow leading-relaxed ${rep.active ? 'text-[#617589]' : 'text-gray-400 dark:text-gray-600'}`}>{rep.d}</p>
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                  {rep.active ? (
                    <>
                      <span className="text-[10px] text-[#617589] font-medium italic">Click to view report</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (rep.path) navigate(rep.path);
                        }}
                        className="py-2 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        View Report
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-400 font-medium italic">Under development</span>
                      <span className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-xs font-bold rounded-lg text-gray-400 cursor-not-allowed">
                        Coming Soon
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
