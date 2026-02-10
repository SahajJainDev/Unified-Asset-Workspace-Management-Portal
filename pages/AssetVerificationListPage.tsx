import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

interface VerificationSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  lastVerifiedDate: string;
  totalAssigned: number;
  totalAssets: number;
  verified: number;
  flagged: number;
  pending: number;
  overallStatus: 'Verified' | 'Discrepant' | 'Pending';
}

interface VerificationCycle {
  _id: string;
  title: string;
  status: 'active' | 'closed';
  startDate: string;
  endDate: string | null;
  createdBy: string;
  submittedCount: number;
  createdAt: string;
}

const AssetVerificationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [summaries, setSummaries] = useState<VerificationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Cycle state
  const [cycles, setCycles] = useState<VerificationCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<VerificationCycle | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [newCycleNotes, setNewCycleNotes] = useState('');
  const [cycleLoading, setCycleLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Fetch cycles on mount
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const [active, all] = await Promise.all([
          apiService.getActiveCycle(),
          apiService.getAllCycles()
        ]);
        setActiveCycle(active);
        setCycles(all);
        // Default selection: active cycle or most recent
        if (active) {
          setSelectedCycleId(active._id);
        } else if (all.length > 0) {
          setSelectedCycleId(all[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch cycles:', err);
      }
    };
    fetchCycles();
  }, []);

  // Fetch summary when selected cycle changes
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await apiService.getVerificationSummary(selectedCycleId || undefined);
        setSummaries(data);
      } catch (err) {
        console.error('Failed to fetch verification summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedCycleId]);

  const handleStartCycle = async () => {
    if (!newCycleTitle.trim()) return;
    try {
      setCycleLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const cycle = await apiService.startVerificationCycle({
        title: newCycleTitle.trim(),
        createdBy: currentUser.empId || 'admin',
        notes: newCycleNotes.trim()
      });
      setActiveCycle({ ...cycle, submittedCount: 0 });
      setCycles(prev => [{ ...cycle, submittedCount: 0 }, ...prev]);
      setSelectedCycleId(cycle._id);
      setShowStartModal(false);
      setNewCycleTitle('');
      setNewCycleNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to start cycle');
    } finally {
      setCycleLoading(false);
    }
  };

  const handleCloseCycle = async () => {
    if (!activeCycle) return;
    try {
      setCycleLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updated = await apiService.closeVerificationCycle(activeCycle._id, currentUser.empId || 'admin');
      setActiveCycle(null);
      setCycles(prev => prev.map(c => c._id === updated._id ? updated : c));
      setShowCloseConfirm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to close cycle');
    } finally {
      setCycleLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: summaries.length, Verified: 0, Discrepant: 0, Pending: 0 };
    summaries.forEach(s => {
      counts[s.overallStatus] = (counts[s.overallStatus] || 0) + 1;
    });
    return counts;
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchesSearch =
        s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.overallStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, summaries]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Verified
          </span>
        );
      case 'Discrepant':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Discrepant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="verification-list" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Asset Verification</h2>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Employee-wise verification status for assigned hardware assets</p>
            </div>
            <div className="flex items-center gap-3">
              {activeCycle ? (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
                >
                  <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                  Close Cycle
                </button>
              ) : (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  Start New Cycle
                </button>
              )}
            </div>
          </div>

          {/* Active Cycle Banner */}
          {activeCycle && (
            <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-[#111418] dark:text-white">{activeCycle.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                    <p className="text-xs text-[#617589] mt-0.5">
                      Started {new Date(activeCycle.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}{activeCycle.submittedCount || summaries.length} employee{(activeCycle.submittedCount || summaries.length) !== 1 ? 's' : ''} submitted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Selector (when there are past cycles) */}
          {cycles.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#617589] uppercase tracking-wider">View Cycle:</span>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
              >
                {cycles.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.title} {c.status === 'active' ? '(Active)' : `(Closed ${new Date(c.endDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Cycle Modal */}
          {showStartModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#1a2632] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">play_circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#111418] dark:text-white">Start Verification Cycle</h3>
                    <p className="text-xs text-[#617589]">All employees will be able to submit their verification</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest block mb-1.5">Cycle Title *</label>
                    <input
                      type="text"
                      value={newCycleTitle}
                      onChange={(e) => setNewCycleTitle(e.target.value)}
                      placeholder="e.g. Q1 2025 Asset Verification"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest block mb-1.5">Notes (Optional)</label>
                    <textarea
                      value={newCycleNotes}
                      onChange={(e) => setNewCycleNotes(e.target.value)}
                      placeholder="Any instructions or notes for this cycle..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => { setShowStartModal(false); setNewCycleTitle(''); setNewCycleNotes(''); }}
                    className="px-5 py-2.5 text-sm font-bold text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartCycle}
                    disabled={!newCycleTitle.trim() || cycleLoading}
                    className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cycleLoading ? 'Starting...' : 'Start Cycle'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Cycle Confirmation */}
          {showCloseConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#1a2632] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600">warning</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#111418] dark:text-white">Close Verification Cycle?</h3>
                    <p className="text-xs text-[#617589]">Employees will no longer be able to submit</p>
                  </div>
                </div>
                <p className="text-sm text-[#617589] mb-6">
                  This will close <strong>"{activeCycle?.title}"</strong>. No more employee submissions will be accepted. You can start a new cycle later.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="px-5 py-2.5 text-sm font-bold text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseCycle}
                    disabled={cycleLoading}
                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                  >
                    {cycleLoading ? 'Closing...' : 'Close Cycle'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">groups</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#111418] dark:text-white">{summaries.length}</p>
                  <p className="text-xs text-[#617589]">Total Employees</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">verified</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{statusCounts['Verified'] || 0}</p>
                  <p className="text-xs text-[#617589]">Fully Verified</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-600">{statusCounts['Discrepant'] || 0}</p>
                  <p className="text-xs text-[#617589]">Discrepant</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">schedule</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">{statusCounts['Pending'] || 0}</p>
                  <p className="text-xs text-[#617589]">Pending Review</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-[#dbe0e6] dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Search by employee name, ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Verified', 'Discrepant', 'Pending'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      statusFilter === status
                        ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusFilter === status
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                    }`}>{statusCounts[status] || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="px-6 py-10 text-center text-[#617589] text-sm">Loading verification data...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4 text-center">Assigned</th>
                      <th className="px-6 py-4 text-center">Verified</th>
                      <th className="px-6 py-4 text-center">Matched</th>
                      <th className="px-6 py-4 text-center">Mismatched</th>
                      <th className="px-6 py-4 text-center">Flagged</th>
                      <th className="px-6 py-4">Last Verified</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                    {filteredSummaries.map((s) => (
                      <tr
                        key={s.employeeId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/verification-detail/${s.employeeId}${selectedCycleId ? `?cycleId=${selectedCycleId}` : ''}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                              {s.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#111418] dark:text-white">{s.employeeName}</p>
                              <p className="text-[10px] text-[#617589] font-mono">EMP-{s.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#617589]">{s.department}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-[#111418] dark:text-white">{s.totalAssigned}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-blue-600">{s.totalAssets}</span>
                            {s.totalAssigned > s.totalAssets && (
                              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">{s.totalAssigned - s.totalAssets} pending</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-emerald-600">{s.verified}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-red-500">{s.pending}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-amber-500">{s.flagged}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#617589]">{formatDate(s.lastVerifiedDate)}</td>
                        <td className="px-6 py-4">{getStatusBadge(s.overallStatus)}</td>
                        <td className="px-6 py-4">
                          <span className="material-symbols-outlined text-[#617589] group-hover:text-primary transition-colors text-[20px]">chevron_right</span>
                        </td>
                      </tr>
                    ))}
                    {filteredSummaries.length === 0 && !loading && (
                      <tr>
                        <td colSpan={10} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-3xl text-gray-400">{statusFilter === 'Verified' ? 'verified' : statusFilter === 'Discrepant' ? 'error' : statusFilter === 'Pending' ? 'schedule' : 'fact_check'}</span>
                            </div>
                            <p className="text-sm font-bold text-[#617589]">
                              {statusFilter === 'All' ? 'No employees with assigned assets' :
                               statusFilter === 'Pending' ? 'No pending verifications' :
                               statusFilter === 'Verified' ? 'No fully verified employees yet' :
                               'No discrepancies found'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {statusFilter === 'All' ? 'Employees with assigned assets will appear here automatically' :
                               statusFilter === 'Pending' ? 'All employees have submitted their verification' :
                               statusFilter === 'Verified' ? 'Employees will appear here once all their assets are verified' :
                               'Great! No discrepancies have been found'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between text-xs font-medium text-[#617589]">
              <p>Showing {filteredSummaries.length} of {summaries.length} employees</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssetVerificationListPage;
