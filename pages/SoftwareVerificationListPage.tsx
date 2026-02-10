import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

interface Verification {
  id: string;
  employeeId: string;
  employeeName: string;
  assetId: string;
  assetName: string;
  computerName: string;
  scannedAt: string;
  softwareCount: number;
  status: string;
}

const SoftwareVerificationListPage: React.FC = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchVerifications = async (p = page, l = limit) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/software-verification/all?page=${p}&limit=${l}`);
      if (res.ok) {
        const json = await res.json();
        setVerifications(json.data || []);
        setTotalCount(json.total || 0);
        setTotalPages(json.pages || 1);
        setPage(json.page || p);
        setLimit(json.limit || l);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    fetchVerifications(page, limit);
  }, [page, limit]);

  const viewDetails = async (verificationId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/software-verification/${verificationId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVerification(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch verification details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="software-verifications" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Software Verifications</h2>
              <p className="text-sm text-gray-500">View all software scan submissions</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-semibold">
                {totalCount} Total Scans
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-[#dbe0e6] dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Employee</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Asset</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Computer</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Software Count</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Scan Date</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : verifications.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No verifications found.</td></tr>
                ) : (
                  verifications.map((ver) => (
                    <tr key={ver.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{ver.employeeName}</p>
                          <p className="text-xs text-gray-500 font-mono">{ver.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{ver.assetName}</p>
                          <p className="text-xs text-primary font-mono">{ver.assetId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{ver.computerName}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-semibold">
                          {ver.softwareCount}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{new Date(ver.scannedAt).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(ver.status)}`}>
                          {ver.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => viewDetails(ver.id)}
                          className="text-primary hover:text-primary/80 font-semibold text-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="h-9 px-3 pr-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="hidden sm:block h-5 w-px bg-gray-300 dark:bg-gray-700"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{verifications.length === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, totalCount)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> results
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 transition-all flex items-center gap-1"
                  title="First page"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 transition-all flex items-center gap-1"
                  title="Previous page"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="flex items-center gap-2 px-4 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{page}</span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{totalPages}</span>
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 transition-all flex items-center gap-1"
                  title="Next page"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 transition-all flex items-center gap-1"
                  title="Last page"
                >
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl w-full max-w-4xl m-4 border border-[#dbe0e6] dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Software Verification Details</h3>
                  <p className="text-sm text-gray-500">{selectedVerification.employee?.name} • {selectedVerification.asset?.tag}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* System Info */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">computer</span>
                    System Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm">
                    <div><span className="text-gray-500">Computer:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.computerName}</span></div>
                    <div><span className="text-gray-500">User:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.userName}</span></div>
                    <div><span className="text-gray-500">OS:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.osVersion}</span></div>
                    <div><span className="text-gray-500">Architecture:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.osArchitecture}</span></div>
                    <div><span className="text-gray-500">Manufacturer:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.manufacturer}</span></div>
                    <div><span className="text-gray-500">Model:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.model}</span></div>
                    <div><span className="text-gray-500">Processor:</span> <span className="font-semibold dark:text-white text-xs">{selectedVerification.systemInfo.processor}</span></div>
                    <div><span className="text-gray-500">RAM:</span> <span className="font-semibold dark:text-white">{selectedVerification.systemInfo.totalRAM} GB</span></div>
                  </div>
                </div>

                {/* Installed Software */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">apps</span>
                    Installed Software ({selectedVerification.softwareCount})
                  </h4>
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Name</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Version</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Publisher</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {selectedVerification.installedSoftware.map((software: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-900 dark:text-white">{software.name}</td>
                              <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{software.version}</td>
                              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{software.publisher}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                                  {software.source}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800/50">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SoftwareVerificationListPage;
