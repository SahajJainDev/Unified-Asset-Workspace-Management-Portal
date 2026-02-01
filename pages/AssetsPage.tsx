
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddAssetModal from '../components/AddAssetModal';
import AIChatBot from '../components/AIChatBot';
import apiService from '../services/apiService';
import { AssetStatus } from '../types';

const AssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAssets();
      // Map API response to table format
      const mappedAssets = data.map((asset: any) => ({
        id: asset.assetTag || asset.id || asset._id, // Ensure we catch _id if tag is missing
        _realId: asset._id, // Keep real ID for reference if needed
        n: asset.assetName,
        d: `${asset.model || ''} • ${asset.specs?.processor || ''} ${asset.specs?.memory || ''}`.trim(),
        u: asset.assignedTo || 'Unassigned',
        s: asset.status,
        sc: asset.status === 'IN USE' ? 'green' : asset.status === 'REPAIR' ? 'amber' : 'blue'
      }));
      setAssets(mappedAssets);
      // Clear selection on refresh
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset =>
      String(asset.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(asset.n).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(asset.u).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, assets]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredAssets.map(a => a.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to DELETE ALL assets? This action cannot be undone.')) {
      try {
        await apiService.deleteAllAssets();
        fetchAssets();
        alert('All assets deleted successfully.');
      } catch (err) {
        alert('Failed to delete assets.');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected assets?`)) {
      try {
        await apiService.deleteBatchAssets(Array.from(selectedIds));
        fetchAssets();
      } catch (err) {
        alert('Failed to delete selected assets.');
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) return;

    const headers = ["Asset ID", "Name", "Details", "Assigned User", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredAssets.map(asset => [
        asset.id,
        `"${asset.n.replace(/"/g, '""')}"`,
        `"${asset.d.replace(/"/g, '""')}"`,
        `"${asset.u.replace(/"/g, '""')}"`,
        asset.s
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AssetTrack_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="assets" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Asset Master List</h2>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Managing {assets.length} enterprise hardware assets</p>
            </div>
            <div className="flex gap-3">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center justify-center rounded-lg h-10 px-4 bg-red-50 text-red-600 border border-red-200 text-sm font-bold gap-2 hover:bg-red-100 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  <span>Delete ({selectedIds.size})</span>
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="flex items-center justify-center rounded-lg h-10 px-4 bg-red-600 text-white text-sm font-bold gap-2 hover:bg-red-700 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                <span>Delete All</span>
              </button>
              <Link to="/upload" className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 text-[#111418] dark:text-white text-sm font-bold gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">upload</span>
                <span>Bulk Upload</span>
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Add New Asset</span>
              </button>
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
                  placeholder="Search by ID, name, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Filter list">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2 text-[#617589] hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Export to CSV"
                  disabled={filteredAssets.length === 0}
                >
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="px-6 py-10 text-center text-[#617589] text-sm">
                  Loading assets...
                </div>
              ) : error ? (
                <div className="px-6 py-10 text-center text-red-500 text-sm">
                  Error loading assets: {error}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary"
                          checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-4">Asset ID</th>
                      <th className="px-6 py-4">Name & Model</th>
                      <th className="px-6 py-4">Assigned User</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                    {filteredAssets.length > 0 ? filteredAssets.map((asset, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group ${selectedIds.has(asset.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded text-primary focus:ring-primary"
                            checked={selectedIds.has(asset.id)}
                            onChange={() => handleSelectRow(asset.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{asset.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{asset.n}</span>
                            <span className="text-xs text-[#617589]">{asset.d}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{asset.u}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${asset.sc === 'green' ? 'bg-green-100 text-green-700' :
                              asset.sc === 'amber' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>{asset.s}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#617589] hover:text-primary p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-[#617589] text-sm italic">
                          No assets found matching your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-[#dbe0e6] dark:border-gray-800 flex items-center justify-between text-xs font-medium text-[#617589]">
              <p>Showing {filteredAssets.length} of {assets.length} assets</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
                <button className="px-3 py-1 bg-primary text-white border border-primary rounded-lg">1</button>
                <button className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
              </div>
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAssetAdded={fetchAssets}
      />
    </div>
  );
};

export default AssetsPage;
