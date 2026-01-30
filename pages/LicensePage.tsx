import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddLicenseModal from '../components/AddLicenseModal';
import AIChatBot from '../components/AIChatBot';
import apiService, { License } from '../services/apiService';

const LicensePage: React.FC = () => {
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getLicenses();
      // Map API response to table format
      const mappedLicenses = data.map((license: any) => ({
        id: license._id,
        softwareName: license.softwareName,
        version: license.version || 'N/A',
        invoiceNumber: license.invoiceNumber || 'N/A',
        addedBy: license.addedBy || 'N/A',
        startDate: license.startDate ? new Date(license.startDate).toLocaleDateString() : 'N/A',
        expiryDate: license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A',
        seatsLimit: license.seatsLimit || 1,
        licenseKey: license.licenseKey || 'N/A',
        assignedSystem: license.assignedSystem || 'Unassigned',
        status: license.expiryDate && new Date(license.expiryDate) < new Date() ? 'Expired' : 'Active',
        statusColor: license.expiryDate && new Date(license.expiryDate) < new Date() ? 'red' : 'green'
      }));
      setLicenses(mappedLicenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="licenses" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
            <div className="flex flex-col gap-2">
              <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">License Management</p>
              <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal">Track license keys, expiry dates, and assignments.</p>
            </div>
            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined mr-2">add</span>
              <span>Add License</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Licenses', value: licenses.length.toString(), icon: 'key', trend: '+5' },
              { label: 'Active Licenses', value: licenses.filter(l => l.status === 'Active').length.toString(), icon: 'check_circle', trend: '95%' },
              { label: 'Expiring Soon', value: '3', icon: 'schedule', trend: 'Next: 7 days' },
            ].map((stat, i) => (
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
                  Loading licenses...
                </div>
              ) : error ? (
                <div className="px-6 py-10 text-center text-red-500 text-sm">
                  Error loading licenses: {error}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8f9fa] dark:bg-gray-800/50 border-b border-[#dbe0e6] dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Software</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">License Key</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                    {licenses.length > 0 ? licenses.map((license, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                              <span className="material-symbols-outlined text-primary">key</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm">{license.softwareName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-mono">{license.licenseKey}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm">{license.expiryDate}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm">{license.assignedSystem}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            license.statusColor === 'green' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>{license.status}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 transition-all shadow-sm">
                            Manage
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-[#617589] text-sm italic">
                          No licenses found
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
        onSuccess={(newLicense: License) => {
          const mappedLicense = {
            id: newLicense._id,
            softwareName: newLicense.softwareName,
            version: newLicense.version || 'N/A',
            invoiceNumber: newLicense.invoiceNumber || 'N/A',
            addedBy: newLicense.addedBy || 'N/A',
            startDate: newLicense.startDate ? new Date(newLicense.startDate).toLocaleDateString() : 'N/A',
            expiryDate: newLicense.expiryDate ? new Date(newLicense.expiryDate).toLocaleDateString() : 'N/A',
            seatsLimit: newLicense.seatsLimit || 1,
            licenseKey: newLicense.licenseKey || 'N/A',
            assignedSystem: newLicense.assignedSystem || 'Unassigned',
            status: newLicense.expiryDate && new Date(newLicense.expiryDate) < new Date() ? 'Expired' : 'Active',
            statusColor: newLicense.expiryDate && new Date(newLicense.expiryDate) < new Date() ? 'red' : 'green'
          };
          setLicenses(prev => [...prev, mappedLicense]);
        }}
      />
    </div>
  );
};

export default LicensePage;
