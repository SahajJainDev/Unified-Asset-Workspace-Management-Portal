
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddAssetModal from '../components/AddAssetModal';
import AIChatBot from '../components/AIChatBot';
import apiService from '../services/apiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label } from 'recharts';

// Chart data will be populated from API response

const DashboardPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive verification stats data from dashboard stats
  const verificationStatsData = dashboardStats?.verificationStats ? [
    { name: 'Verified', value: dashboardStats.verificationStats.verified, color: '#10b981' },
    { name: 'Pending', value: dashboardStats.verificationStats.pending, color: '#f59e0b' },
    { name: 'Flagged', value: dashboardStats.verificationStats.flagged, color: '#ef4444' }
  ] : [];

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleSendVerification = () => {
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 3000);
    // Logic to send notification to all employees
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="dashboard" />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
        <Header />
        
        <div className="p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-4 text-center py-8 text-[#617589]">Loading dashboard stats...</div>
            ) : error ? (
              <div className="col-span-4 text-center py-8 text-red-500">Error: {error}</div>
            ) : dashboardStats ? (
              [
                { label: 'Total Assets', value: dashboardStats.totalAssets.toLocaleString(), sub: 'Managed enterprise assets', icon: 'inventory_2', trend: '2.4%', trendUp: true, color: 'text-primary' },
                { label: 'Desk Occupancy', value: `${Math.round((dashboardStats.deskStatus.occupied / dashboardStats.deskStatus.total) * 100)}%`, sub: `${dashboardStats.deskStatus.occupied}/${dashboardStats.deskStatus.total} desks occupied`, icon: 'table_restaurant', trend: '5.0%', trendUp: true, color: 'text-indigo-500' },
                { label: 'Expiring Licenses', value: dashboardStats.expiringLicenses.toString(), sub: 'Due in < 30 days', icon: 'business_center', badge: dashboardStats.expiringLicenses > 0 ? 'Action Needed' : null, badgeColor: 'bg-amber-100 text-amber-700', color: 'text-amber-500' },
                { label: 'Pending Alerts', value: '5', sub: 'Requires attention', icon: 'report', badge: 'Critical', badgeColor: 'bg-red-100 text-red-700', color: 'text-red-500' },
              ].map((card, i) => (
                <div key={i} className="bg-white dark:bg-[#1a2632] p-5 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`size-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${card.color}`}>
                      <span className="material-symbols-outlined">{card.icon}</span>
                    </div>
                    {card.trend && (
                      <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <span className="material-symbols-outlined text-[14px]">{card.trendUp ? 'trending_up' : 'trending_down'}</span>
                        {card.trend}
                      </span>
                    )}
                    {card.badge && (
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-black mt-1">{card.value}</p>
                    <p className="text-[10px] font-medium text-[#617589] mt-1">{card.sub}</p>
                  </div>
                </div>
              ))
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-black text-lg leading-tight">Asset Distribution</h3>
                      <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">By Category</p>
                    </div>
                  </div>
                  <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardStats?.assetDistribution || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                        />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                          {(dashboardStats?.assetDistribution || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-black text-lg leading-tight">Asset Verification</h3>
                      <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Attestation Status</p>
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={verificationStatsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                        />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                          {verificationStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Row Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 flex-1">
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm h-full flex flex-col">
                  <h3 className="font-black text-lg">Desk Status</h3>
                  <p className="text-xs text-[#617589] mb-4">Real-time occupancy (500 Total)</p>
                  <div className="flex items-center flex-1">
                    <div className="w-1/2 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Occupied', value: dashboardStats?.deskStatus?.occupied || 0, color: '#137fec' },
                              { name: 'Available', value: dashboardStats?.deskStatus?.available || 0, color: '#276221' },
                              { name: 'Reserved', value: dashboardStats?.deskStatus?.reserved || 0, color: '#94a3b8' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: 'Occupied', value: dashboardStats?.deskStatus?.occupied || 0, color: '#137fec' },
                              { name: 'Available', value: dashboardStats?.deskStatus?.available || 0, color: '#276221' },
                              { name: 'Reserved', value: dashboardStats?.deskStatus?.reserved || 0, color: '#94a3b8' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <Label
                              value={`${dashboardStats?.deskStatus ? Math.round((dashboardStats.deskStatus.occupied / dashboardStats.deskStatus.total) * 100) : 0}%`}
                              position="center"
                              style={{ fontSize: '20px', fontWeight: 900, fill: '#111827' }}
                            />
                            <Label
                              value="Occupied"
                              position="center"
                              dy={18}
                              style={{ fontSize: '10px', fontWeight: 600, fill: '#64748b' }}
                            />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-3 pl-4">
                      {[
                        { name: 'Occupied', value: dashboardStats?.deskStatus?.occupied || 0 },
                        { name: 'Available', value: dashboardStats?.deskStatus?.available || 0 },
                        { name: 'Reserved', value: dashboardStats?.deskStatus?.reserved || 0 }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`size-3 rounded-full shrink-0 ${
                            item.name === 'Occupied' ? 'bg-primary' :
                            item.name === 'Available' ? 'bg-gray-200' : 'bg-slate-400'
                          }`}></div>
                          <div>
                            <p className="text-[10px] font-bold leading-none">{item.name}</p>
                            <p className="text-[10px] text-[#617589] font-medium mt-0.5">{item.value} Desks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary p-6 rounded-2xl border border-primary shadow-xl shadow-primary/20 text-white flex flex-col h-full relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-black text-lg">Compliance Center</h3>
                    <p className="text-xs text-blue-100/80 mb-6">Automated notifications and reminders.</p>
                    <div className="space-y-3">
                      <button 
                        onClick={handleSendVerification}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all border border-white/20 text-sm font-bold w-full ${
                          notificationSent ? 'bg-emerald-500/40 border-emerald-400' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">{notificationSent ? 'done_all' : 'campaign'}</span>
                          <span>{notificationSent ? 'Notification Sent!' : 'Send Bulk Verification Reminder'}</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-sm font-bold w-full"
                      >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        <span>Add New Asset</span>
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 size-40 bg-white/5 rounded-full blur-3xl"></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-lg">Recent Activity</h3>
                <button className="text-primary text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-2">
                {(dashboardStats?.recentActivities || []).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.color}`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{item.title}</p>
                        <span className="text-[10px] text-[#617589] font-medium whitespace-nowrap">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-[#617589] mt-0.5 leading-relaxed">{item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>

      <AddAssetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default DashboardPage;
