import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

interface AssetVerificationItem {
  assetId: string | null;
  assetTag: string;
  assetName: string;
  assetType: string;
  model: string;
  serialNumber: string;
  enteredAssetId: string;
  status: string;
  notes: string;
  verificationDate: string;
  isMatch: boolean;
}

interface EmployeeDetail {
  empId: string;
  fullName: string;
  department: string;
  email: string;
}

interface VerificationDetail {
  employee: EmployeeDetail;
  overallStatus: string;
  totalAssigned: number;
  totalVerified: number;
  matched: number;
  mismatched: number;
  flagged: number;
  latestSessionDate: string | null;
  assets: AssetVerificationItem[];
  allSessions: Array<{ date: string; count: number; verified: number; discrepant: number }>;
}

const AssetVerificationDetailPage: React.FC = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycleId') || undefined;
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!empId) return;
      try {
        setLoading(true);
        const data = await apiService.getEmployeeVerificationDetail(empId, cycleId);
        setDetail(data);
      } catch (err: any) {
        console.error('Failed to fetch verification detail:', err);
        setError('Failed to load verification details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [empId, cycleId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Verified
          </span>
        );
      case 'Discrepant':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Discrepant
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <span className="material-symbols-outlined text-[14px]">flag</span>
            Flagged / Lost
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            ID Mismatch
          </span>
        );
      default:
        return null;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Laptop': return 'laptop_mac';
      case 'Monitor': return 'desktop_windows';
      case 'Mouse': return 'mouse';
      case 'Keyboard': return 'keyboard';
      case 'Smartphone': return 'smartphone';
      case 'Tablet': return 'tablet';
      default: return 'devices';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar activeTab="verification-list" />
        <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
          <Header />
          <div className="flex-1 flex items-center justify-center text-[#617589]">Loading verification details...</div>
        </main>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar activeTab="verification-list" />
        <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
          <Header />
          <div className="flex-1 flex items-center justify-center text-red-500">{error || 'No data found'}</div>
        </main>
      </div>
    );
  }

  const { employee, overallStatus, totalAssigned, totalVerified, matched, mismatched, flagged, assets, latestSessionDate } = detail;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="verification-list" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Back Button + Header */}
          <div>
            <button
              onClick={() => navigate('/verification-list')}
              className="flex items-center gap-1 text-sm text-[#617589] hover:text-primary transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Verification List
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black">
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">{employee.fullName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono text-[#617589] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">EMP-{employee.empId}</span>
                    <span className="text-xs text-[#617589]">{employee.department}</span>
                    <span className="text-xs text-[#617589]">{employee.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(overallStatus)}
                {latestSessionDate && (
                  <span className="text-xs text-[#617589]">Last verified: {formatDate(latestSessionDate)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-black text-[#111418] dark:text-white">{totalAssigned}</p>
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Assigned Assets</p>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-black text-blue-600">{totalVerified}</p>
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Submitted</p>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-black text-emerald-600">{matched}</p>
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">ID Matched</p>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-black text-red-500">{mismatched}</p>
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">ID Mismatch</p>
            </div>
            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-black text-amber-500">{flagged}</p>
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Flagged / Lost</p>
            </div>
          </div>

          {/* Asset Verification Detail Table */}
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-[#dbe0e6] dark:border-gray-800">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Asset-wise Verification Breakdown</h3>
              <p className="text-xs text-[#617589] mt-0.5">Detailed comparison of expected vs entered asset IDs</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Expected Asset ID</th>
                    <th className="px-6 py-4">Entered Asset ID</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {assets.map((asset, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${
                            asset.isMatch ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                            asset.status === 'Flagged' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                            'bg-red-50 dark:bg-red-900/20 text-red-600'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">{getAssetIcon(asset.assetType)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111418] dark:text-white">{asset.assetName}</p>
                            {asset.model && <p className="text-[10px] text-[#617589]">{asset.model}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#617589] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{asset.assetType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-primary">{asset.assetTag}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm font-bold ${
                          asset.status === 'Flagged' ? 'text-amber-600' :
                          asset.isMatch ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {asset.enteredAssetId === 'REPORTED_LOST' ? '— REPORTED LOST —' : asset.enteredAssetId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {asset.status === 'Flagged' ? (
                          <span className="material-symbols-outlined text-amber-500 text-[22px]">flag</span>
                        ) : asset.isMatch ? (
                          <span className="material-symbols-outlined text-emerald-500 text-[22px]">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-red-500 text-[22px]">cancel</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(asset.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#617589] max-w-[200px] truncate" title={asset.notes}>
                        {asset.notes || '—'}
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-gray-400">inventory_2</span>
                          </div>
                          <p className="text-sm font-bold text-[#617589]">No verification data found for this employee</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-[#dbe0e6] dark:border-gray-800 flex flex-wrap items-center gap-6 text-xs font-medium text-[#617589]">
              <span>{assets.length} assets verified</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                {matched} matched
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-red-500 text-[14px]">cancel</span>
                {mismatched} mismatched
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-500 text-[14px]">flag</span>
                {flagged} flagged
              </span>
            </div>
          </div>

          {/* Verification History */}
          {detail.allSessions.length > 1 && (
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-[#dbe0e6] dark:border-gray-800">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white">Verification History</h3>
                <p className="text-xs text-[#617589] mt-0.5">Past verification sessions by this employee</p>
              </div>
              <div className="p-4 space-y-3">
                {detail.allSessions.map((session, idx) => (
                  <div key={session.date} className={`flex items-center justify-between p-3 rounded-xl ${
                    idx === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 dark:bg-gray-800/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${
                        idx === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-[#617589]'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111418] dark:text-white">{formatDate(session.date)}</p>
                        <p className="text-[10px] text-[#617589]">{session.count} assets verified</p>
                      </div>
                      {idx === 0 && <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Latest</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-600 font-bold">{session.verified} matched</span>
                      <span className="text-red-500 font-bold">{session.discrepant} discrepant</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssetVerificationDetailPage;
