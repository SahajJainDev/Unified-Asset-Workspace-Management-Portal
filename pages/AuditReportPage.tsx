import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

interface ActionItem {
  _id: string;
  enteredAssetId: string;
  employeeId: string;
  employeeName: string;
  status: 'Pending' | 'Flagged';
  verificationDate: string | null;
  notes: string;
  asset: {
    name: string;
    tag: string;
    type: string;
    model: string;
    serialNumber: string;
    status: string;
  } | null;
}

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  totalAssets: number;
  verified: number;
  pending: number;
  flagged: number;
  compliance: number;
}

interface AuditReport {
  generatedAt: string;
  sections: {
    assets: {
      totalAssets: number;
      statusBreakdown: Array<{ _id: string; count: number }>;
      byType: Array<{ _id: string; count: number }>;
      assigned: number;
      unassigned: number;
      warrantyExpired: number;
      warrantyExpiring: number;
    };
    verification: {
      total: number;
      verified: number;
      pending: number;
      flagged: number;
      employeeSummary: EmployeeSummary[];
      actionItems: ActionItem[];
    };
    licenses: {
      total: number;
      active: number;
      expired: number;
      expiring: number;
      bySoftware: Array<{
        _id: string;
        total: number;
        totalSeats: number;
        expired: number;
        active: number;
        expiring: number;
      }>;
    };
    workspace: {
      totalDesks: number;
      occupied: number;
      available: number;
      utilization: number;
    };
  };
  findings: Array<{
    severity: 'high' | 'medium' | 'low';
    message: string;
    area: string;
  }>;
}

const AuditReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | 'Pending' | 'Flagged'>('all');
  const [actionItemsVisible, setActionItemsVisible] = useState(25);

  useEffect(() => {
    fetchAuditReport();
  }, []);

  const fetchAuditReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAuditReport();
      setAuditData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audit report');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'help';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'Flagged') return 'Discrepant';
    return status;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Flagged': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const allActionItems = auditData?.sections.verification.actionItems || [];
  const filteredActionItems = allActionItems.filter(
    v => actionFilter === 'all' || v.status === actionFilter
  );
  const visibleActionItems = filteredActionItems.slice(0, actionItemsVisible);
  const hasMoreActionItems = filteredActionItems.length > actionItemsVisible;

  const getComplianceColor = (pct: number) => {
    if (pct === 100) return 'text-green-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getComplianceBarColor = (pct: number) => {
    if (pct === 100) return 'bg-green-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="reports" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[#617589] font-medium">Generating audit report...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-8 max-w-[1200px] mx-auto w-full">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-medium">{error}</span>
              <button onClick={fetchAuditReport} className="ml-auto text-sm font-bold underline">Retry</button>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!loading && auditData && (
          <div className="p-8 space-y-6 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/reports')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors print:hidden"
                >
                  <span className="material-symbols-outlined text-[#617589]">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black">Audit Report</h1>
                    <p className="text-sm text-[#617589]">
                      Generated on {new Date(auditData.generatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(auditData.generatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 print:hidden">
                <button
                  onClick={fetchAuditReport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  Regenerate
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">print</span>
                  Print
                </button>
              </div>
            </div>

            {/* Findings & Flags */}
            {auditData.findings.length > 0 && (
              <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">flag</span>
                  Findings & Flags
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold ml-2">{auditData.findings.length}</span>
                </h3>
                <div className="space-y-2">
                  {auditData.findings.map((finding, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <span className={`material-symbols-outlined text-lg ${
                        finding.severity === 'high' ? 'text-red-500' :
                        finding.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {getSeverityIcon(finding.severity)}
                      </span>
                      <span className="flex-1 text-sm font-medium">{finding.message}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider ${getSeverityStyle(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="text-[10px] text-[#617589] font-medium bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {finding.area}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== ASSET AUDIT ========== */}
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">inventory_2</span>
                Asset Audit
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
                {[
                  { label: 'Total Assets', value: auditData.sections.assets.totalAssets, color: 'text-slate-900 dark:text-white' },
                  { label: 'Assigned', value: auditData.sections.assets.assigned, color: 'text-green-600' },
                  { label: 'Unassigned', value: auditData.sections.assets.unassigned, color: 'text-amber-600' },
                  { label: 'Warranty Expired', value: auditData.sections.assets.warrantyExpired, color: auditData.sections.assets.warrantyExpired > 0 ? 'text-red-600' : 'text-green-600' },
                  { label: 'Warranty Expiring', value: auditData.sections.assets.warrantyExpiring, color: auditData.sections.assets.warrantyExpiring > 0 ? 'text-amber-600' : 'text-green-600' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-[#617589] font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Breakdown */}
                {auditData.sections.assets.statusBreakdown.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider mb-3">By Status</p>
                    <div className="space-y-2">
                      {auditData.sections.assets.statusBreakdown.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-[#617589]">{st._id || 'Unknown'}</span>
                          <span className="text-sm font-bold">{st.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* By Type */}
                {auditData.sections.assets.byType.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider mb-3">By Type</p>
                    <div className="space-y-2">
                      {auditData.sections.assets.byType.map((tp, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-[#617589]">{tp._id || 'Other'}</span>
                          <span className="text-sm font-bold">{tp.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========== VERIFICATION AUDIT ========== */}
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">verified_user</span>
                  Verification Audit
                </h3>
                <span className="text-xs text-[#617589] font-medium">
                  {auditData.sections.verification.employeeSummary.length} employees · {auditData.sections.verification.total} assets
                </span>
              </div>

              {/* Summary counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black">{auditData.sections.verification.total}</div>
                  <div className="text-[10px] text-[#617589] font-bold uppercase tracking-wider mt-1">Total</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-600">{auditData.sections.verification.verified}</div>
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">Verified</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-amber-600">{auditData.sections.verification.pending}</div>
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1">Pending</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-red-600">{auditData.sections.verification.flagged}</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1">Discrepant</div>
                </div>
              </div>

              {/* Stacked bar */}
              {auditData.sections.verification.total > 0 && (
                <div className="mb-5">
                  <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${(auditData.sections.verification.verified / auditData.sections.verification.total) * 100}%` }}></div>
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${(auditData.sections.verification.pending / auditData.sections.verification.total) * 100}%` }}></div>
                    <div className="bg-red-500 h-full transition-all" style={{ width: `${(auditData.sections.verification.flagged / auditData.sections.verification.total) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-green-600 font-bold">{Math.round((auditData.sections.verification.verified / auditData.sections.verification.total) * 100)}% Verified</span>
                    <span className="text-[10px] text-amber-600 font-bold">{Math.round((auditData.sections.verification.pending / auditData.sections.verification.total) * 100)}% Pending</span>
                    <span className="text-[10px] text-red-600 font-bold">{Math.round((auditData.sections.verification.flagged / auditData.sections.verification.total) * 100)}% Discrepant</span>
                  </div>
                </div>
              )}

              {/* ---- Employee Compliance Summary ---- */}
              <div className="mb-2">
                <p className="text-xs font-bold text-[#617589] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  Employee Compliance Summary
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-[#617589]">
                      <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Employee</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Assets</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Verified</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Pending</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Discrepant</th>
                      <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider min-w-[160px]">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {auditData.sections.verification.employeeSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#617589]">No employees with assigned assets</td>
                      </tr>
                    ) : (
                      auditData.sections.verification.employeeSummary.map((emp, idx) => (
                        <tr key={emp.employeeId || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium">{emp.employeeName}</div>
                            <div className="text-[10px] text-[#617589]">{emp.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{emp.totalAssets}</td>
                          <td className="px-4 py-3 text-center">
                            {emp.verified > 0 ? <span className="text-green-600 font-medium">{emp.verified}</span> : <span className="text-[#617589]">0</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {emp.pending > 0 ? <span className="text-amber-600 font-medium">{emp.pending}</span> : <span className="text-[#617589]">0</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {emp.flagged > 0 ? <span className="text-red-600 font-medium">{emp.flagged}</span> : <span className="text-[#617589]">0</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${getComplianceBarColor(emp.compliance)}`} style={{ width: `${emp.compliance}%` }}></div>
                              </div>
                              <span className={`text-xs font-bold min-w-[36px] text-right ${getComplianceColor(emp.compliance)}`}>
                                {emp.compliance}%
                              </span>
                              {emp.compliance === 100 && <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ---- Action Items (Pending + Discrepant only) ---- */}
              {allActionItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-amber-500">priority_high</span>
                      Action Items
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{allActionItems.length}</span>
                    </p>
                    <div className="flex gap-2 print:hidden">
                      {[
                        { key: 'all' as const, label: 'All', count: allActionItems.length },
                        { key: 'Pending' as const, label: 'Pending', count: allActionItems.filter(a => a.status === 'Pending').length },
                        { key: 'Flagged' as const, label: 'Discrepant', count: allActionItems.filter(a => a.status === 'Flagged').length },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => { setActionFilter(tab.key); setActionItemsVisible(25); }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            actionFilter === tab.key
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-[#617589]">
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Asset Tag</th>
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Asset Name</th>
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Type</th>
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Employee</th>
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {visibleActionItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[#617589]">No action items</td>
                          </tr>
                        ) : (
                          visibleActionItems.map((v, idx) => (
                            <tr key={v._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-xs">{v.asset?.tag || v.enteredAssetId || '—'}</td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{v.asset?.name || '—'}</div>
                                {v.asset?.model && <div className="text-[10px] text-[#617589]">{v.asset.model}</div>}
                              </td>
                              <td className="px-4 py-3 text-[#617589]">{v.asset?.type || '—'}</td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{v.employeeName}</div>
                                {v.employeeId && <div className="text-[10px] text-[#617589]">{v.employeeId}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider ${getStatusStyle(v.status)}`}>
                                  {getStatusLabel(v.status)}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-xs max-w-[200px] truncate ${v.status === 'Pending' ? 'text-amber-500 italic' : 'text-[#617589]'}`}>
                                {v.notes || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Show more / Showing X of Y */}
                  {filteredActionItems.length > 0 && (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-[#617589]">
                        Showing {Math.min(actionItemsVisible, filteredActionItems.length)} of {filteredActionItems.length} action items
                      </span>
                      {hasMoreActionItems && (
                        <button
                          onClick={() => setActionItemsVisible(prev => prev + 25)}
                          className="text-xs font-bold text-primary hover:underline print:hidden"
                        >
                          Show more →
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* All clear message */}
              {allActionItems.length === 0 && auditData.sections.verification.total > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="material-symbols-outlined text-green-500 text-2xl">task_alt</span>
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">All Clear</p>
                    <p className="text-xs text-green-600 dark:text-green-500">All {auditData.sections.verification.total} asset verifications are complete with no discrepancies.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ========== LICENSE AUDIT ========== */}
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-500">license</span>
                License Audit
              </h3>

              {/* Summary counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black">{auditData.sections.licenses.total}</div>
                  <div className="text-[10px] text-[#617589] font-bold uppercase tracking-wider mt-1">Total</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-600">{auditData.sections.licenses.active}</div>
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">Active</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-amber-600">{auditData.sections.licenses.expiring}</div>
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1">Expiring (30d)</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-red-600">{auditData.sections.licenses.expired}</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1">Expired</div>
                </div>
              </div>

              {/* License bar */}
              {auditData.sections.licenses.total > 0 && (
                <div className="mb-5">
                  <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                    <div className="bg-green-500 h-full" style={{ width: `${(auditData.sections.licenses.active / auditData.sections.licenses.total) * 100}%` }}></div>
                    <div className="bg-amber-500 h-full" style={{ width: `${(auditData.sections.licenses.expiring / auditData.sections.licenses.total) * 100}%` }}></div>
                    <div className="bg-red-500 h-full" style={{ width: `${(auditData.sections.licenses.expired / auditData.sections.licenses.total) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* By Software breakdown table */}
              {auditData.sections.licenses.bySoftware.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50 text-[#617589]">
                        <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Software</th>
                        <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Total</th>
                        <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Seats</th>
                        <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Active</th>
                        <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Expiring</th>
                        <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Expired</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {auditData.sections.licenses.bySoftware.map((sw, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="px-4 py-3 font-bold">{sw._id}</td>
                          <td className="px-4 py-3 text-center">{sw.total}</td>
                          <td className="px-4 py-3 text-center text-[#617589]">{sw.totalSeats}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-medium">{sw.active}</td>
                          <td className="px-4 py-3 text-center">
                            {sw.expiring > 0 ? <span className="text-amber-600 font-medium">{sw.expiring}</span> : <span className="text-[#617589]">0</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {sw.expired > 0 ? <span className="text-red-600 font-medium">{sw.expired}</span> : <span className="text-[#617589]">0</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ========== WORKSPACE AUDIT ========== */}
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">table_restaurant</span>
                Workspace Audit
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black">{auditData.sections.workspace.totalDesks}</div>
                  <div className="text-[10px] text-[#617589] font-bold uppercase tracking-wider mt-1">Total Desks</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-600">{auditData.sections.workspace.occupied}</div>
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">Occupied</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">{auditData.sections.workspace.available}</div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Available</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black">{auditData.sections.workspace.utilization}%</div>
                  <div className="text-[10px] text-[#617589] font-bold uppercase tracking-wider mt-1">Utilization</div>
                </div>
              </div>

              {/* Utilization donut */}
              <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={auditData.sections.workspace.utilization >= 80 ? '#22c55e' : auditData.sections.workspace.utilization >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${auditData.sections.workspace.utilization}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black">{auditData.sections.workspace.utilization}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold">Desk Utilization</p>
                  <p className="text-sm text-[#617589]">{auditData.sections.workspace.occupied} of {auditData.sections.workspace.totalDesks} desks currently occupied</p>
                  <p className="text-sm text-[#617589]">{auditData.sections.workspace.available} desks available for allocation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditReportPage;
