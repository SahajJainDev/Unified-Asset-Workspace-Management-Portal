
import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ReportsPage: React.FC = () => {
  const reports = [
    { t: 'Audit Report', d: 'Full compliance check across all office locations and remote staff.', i: 'verified_user', s: 'Up to Date', c: 'blue' },
    { t: 'Financial Assets', d: 'Track hardware expenditures, depreciation schedules, and tax reports.', i: 'receipt_long', s: 'Financial', c: 'green' },
    { t: 'Utilization Score', d: 'Desk and meeting room occupancy trends & hardware efficiency scores.', i: 'meeting_room', s: 'Utilization', c: 'amber' },
    { t: 'Security Compliance', d: 'Status of encryption, anti-virus, and security patch levels across fleet.', i: 'security', s: 'High Priority', c: 'red' },
    { t: 'Inventory Forecast', d: 'Predictive modeling for hardware refresh cycles based on age.', i: 'timeline', s: 'Planning', c: 'indigo' },
    { t: 'Vendor Performance', d: 'SLA tracking for support and hardware delivery from main vendors.', i: 'store', s: 'Procurement', c: 'purple' },
  ];

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="reports" />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black">Advanced Reports</h1>
              <p className="text-[#617589]">Centralized dashboard for utilization, compliance, and financial data.</p>
            </div>
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined">ios_share</span> Generate All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((rep, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 flex flex-col h-72 hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors`}>
                    <span className="material-symbols-outlined">{rep.i}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${rep.c === 'blue' ? 'bg-blue-100 text-blue-700' :
                      rep.c === 'green' ? 'bg-green-100 text-green-700' :
                        rep.c === 'red' ? 'bg-red-100 text-red-700' :
                          rep.c === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-indigo-100 text-indigo-700'
                    }`}>{rep.s}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{rep.t}</h3>
                <p className="text-sm text-[#617589] flex-grow leading-relaxed">{rep.d}</p>
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] text-[#617589] font-medium italic">Last generated 2 days ago</span>
                  <button className="py-2 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
                    View Report
                  </button>
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
