
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddLicenseModal from '../components/AddLicenseModal';
import AIChatBot from '../components/AIChatBot';
import apiService from '../services/apiService';

const SoftwarePage: React.FC = () => {
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [software, setSoftware] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSoftware = software.filter(sw =>
    sw.n.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSoftware();
      // Map API response to table format
      const mappedSoftware = data.map((sw: any) => ({
        n: sw.name,
        v: sw.version || 'Web-based',
        u: sw.utilization || `${sw.usedSeats}/${sw.totalSeats}`,
        p: sw.percentage || `${sw.utilizationPercentage}%`,
        s: sw.status,
        c: sw.statusColor,
        icon: sw.icon
      }));
      setSoftware(mappedSoftware);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch software');
    } finally {
      setLoading(false);
    }
  };

  const [stats, setStats] = useState<any[]>([
    { label: 'Total Licenses', value: '-', icon: 'package_2', trend: '' },
    { label: 'Utilization Avg', value: '-', icon: 'group_work', trend: '' },
    { label: 'Renewals Pending', value: '-', icon: 'event_repeat', trend: '' },
  ]);

  const fetchStats = async () => {
    try {
      const data = await apiService.getSoftwareStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      await apiService.uploadSoftwareBatch(file);
      alert('Software imported successfully!');
      fetchSoftware();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to import software');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchSoftware();
    fetchStats();
  }, []);

  const handleLicenseAdded = () => {
    fetchSoftware(); // Refresh list to show new seats/software
    fetchStats();    // Refresh stats
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="software" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
            <div className="flex flex-col gap-2">
              <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Software Management</p>
              <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal">Track seat utilization and renewal lifecycles.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search software..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center justify-center rounded-lg h-12 px-6 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 text-[#111418] dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined mr-2">upload</span>
                <span>{importing ? 'Importing...' : 'Bulk Import'}</span>
              </button>
              <button
                onClick={() => setIsLicenseModalOpen(true)}
                className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                <span>Add License</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-[#dbe0e6] dark:border-gray-800 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-[#617589]">{stat.label}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold text-primary">{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="px-6 py-10 text-center text-[#617589] text-sm">
                  Loading software...
                </div>
              ) : error ? (
                <div className="px-6 py-10 text-center text-red-500 text-sm">
                  Error loading software: {error}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8f9fa] dark:bg-gray-800/50 border-b border-[#dbe0e6] dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Software</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Utilization</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                    {filteredSoftware.length > 0 ? filteredSoftware.map((sw, i) => (
                      <tr
                        key={i}
                        onClick={() => window.location.href = `/licenses?software=${encodeURIComponent(sw.n)}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                              <span className="material-symbols-outlined text-primary">{sw.icon}</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm">{sw.n}</p>
                              <p className="text-xs text-[#617589]">{sw.v}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1 w-48">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{sw.u} Seats</span>
                              <span className={parseInt(sw.p) > 90 ? 'text-red-500' : 'text-[#617589]'}>{sw.p}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${parseInt(sw.p) > 90 ? 'bg-red-500' :
                                  parseInt(sw.p) > 80 ? 'bg-amber-500' : 'bg-primary'
                                  }`}
                                style={{ width: sw.p }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${sw.c === 'green' ? 'bg-green-100 text-green-700' :
                            sw.c === 'amber' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{sw.s}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-[#617589] text-sm italic">
                          No software found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>

      <AddLicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onSuccess={handleLicenseAdded}
      />
    </div>
  );
};

export default SoftwarePage;
