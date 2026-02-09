
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
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Category management state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [reassigningCategory, setReassigningCategory] = useState<any>(null);
  const [reassignTargetId, setReassignTargetId] = useState('');

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const data = await apiService.getAssetCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setCategoryLoading(false);
    }
  };

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
        t: asset.assetType || 'Other',
        d: `${asset.model || ''} • ${asset.specs?.processor || ''} ${asset.specs?.memory || ''}`.trim(),
        u: (asset.employee && asset.employee.name) || asset.assignedTo || 'Unassigned',
        s: asset.status,
        sc: asset.status === 'Assigned' ? 'purple' :
            asset.status === 'Available' ? 'emerald' :
            asset.status === 'IN USE' ? 'green' :
            asset.status === 'STORAGE' ? 'slate' :
            asset.status === 'REPAIR' ? 'amber' :
            asset.status === 'Damaged' ? 'red' :
            asset.status === 'Not Available' ? 'rose' : 'blue'
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
    fetchCategories();
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All': assets.length,
      'Available': 0,
      'Assigned': 0,
      'IN USE': 0,
      'STORAGE': 0,
      'REPAIR': 0,
      'Damaged': 0,
      'Not Available': 0
    };
    assets.forEach(asset => {
      if (counts[asset.s] !== undefined) {
        counts[asset.s]++;
      }
    });
    return counts;
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = String(asset.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(asset.n).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(asset.u).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || asset.s === statusFilter;
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(asset.t);
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, selectedCategories, assets]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': assets.length };
    assets.forEach(asset => {
      const cat = asset.t || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [assets]);

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await apiService.createAssetCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await apiService.updateAssetCategory(id, { name: editName.trim() });
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (cat.assetCount > 0) {
      // Has assets — open reassign flow
      setReassigningCategory(cat);
      setReassignTargetId('');
      return;
    }
    if (!window.confirm(`Permanently delete "${cat.name}"?`)) return;
    try {
      await apiService.deleteAssetCategory(cat._id);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleReassignAndDelete = async () => {
    if (!reassigningCategory || !reassignTargetId) return;
    try {
      await apiService.reassignAndDeleteCategory(reassigningCategory._id, reassignTargetId);
      setReassigningCategory(null);
      setReassignTargetId('');
      fetchCategories();
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign and delete category');
    }
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
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 text-[#111418] dark:text-white text-sm font-bold gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">category</span>
                <span>Categories</span>
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

          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800">
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

            {/* Status Filter Pills */}
            <div className="px-4 py-3 border-b border-[#dbe0e6] dark:border-gray-800 flex items-center gap-2 overflow-x-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'All'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>All</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'All' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['All']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('Available')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'Available'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Available</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Available' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['Available']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('Assigned')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'Assigned'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Assigned</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Assigned' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['Assigned']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('IN USE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'IN USE'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>In Use</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'IN USE' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['IN USE']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('STORAGE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'STORAGE'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Storage</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'STORAGE' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['STORAGE']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('REPAIR')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'REPAIR'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Repair</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'REPAIR' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['REPAIR']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('Damaged')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'Damaged'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Damaged</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Damaged' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['Damaged']}</span>
                </button>
                <button
                  onClick={() => setStatusFilter('Not Available')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    statusFilter === 'Not Available'
                      ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418] shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-[#617589] dark:text-gray-400 border border-[#dbe0e6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Not Available</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Not Available' 
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#111418]' 
                      : 'bg-gray-100 dark:bg-gray-700 text-[#617589] dark:text-gray-400'
                  }`}>{statusCounts['Not Available']}</span>
                </button>
              </div>
            </div>

            {/* Category Multi-Select Filter */}
            <div className="px-4 py-3 border-b border-[#dbe0e6] dark:border-gray-800 flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#617589] uppercase tracking-widest shrink-0">Category</span>
              <div className="relative">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm font-medium text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all min-w-[200px] justify-between"
                >
                  <span className="truncate">
                    {selectedCategories.size === 0
                      ? 'All Categories'
                      : selectedCategories.size === 1
                        ? Array.from(selectedCategories)[0]
                        : `${selectedCategories.size} selected`}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#617589] shrink-0">{isCategoryDropdownOpen ? 'expand_less' : 'expand_more'}</span>
                </button>
                {isCategoryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => setSelectedCategories(new Set())}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                        {Object.entries(categoryCounts).filter(([cat]) => cat !== 'All').map(([cat, count]) => {
                          const isSelected = selectedCategories.has(cat);
                          return (
                            <label
                              key={cat}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedCategories);
                                  if (isSelected) next.delete(cat); else next.add(cat);
                                  setSelectedCategories(next);
                                }}
                                className="rounded text-primary focus:ring-primary size-4"
                              />
                              <span className="flex-1 text-sm font-medium text-[#111418] dark:text-white">{cat}</span>
                              <span className="text-xs font-semibold text-[#617589] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{count}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {selectedCategories.size > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Array.from(selectedCategories).map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full"
                    >
                      {cat}
                      <button
                        onClick={() => {
                          const next = new Set(selectedCategories);
                          next.delete(cat);
                          setSelectedCategories(next);
                        }}
                        className="hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              asset.sc === 'purple' ? 'bg-purple-100 text-purple-700' :
                              asset.sc === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                              asset.sc === 'green' ? 'bg-green-100 text-green-700' :
                              asset.sc === 'slate' ? 'bg-slate-100 text-slate-600' :
                              asset.sc === 'amber' ? 'bg-amber-100 text-amber-700' :
                              asset.sc === 'red' ? 'bg-red-100 text-red-700' :
                              asset.sc === 'rose' ? 'bg-rose-100 text-rose-600' :
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
        categories={categories}
      />

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsCategoryModalOpen(false); setReassigningCategory(null); }}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#111418] dark:text-white tracking-tight">Manage Asset Categories</h3>
                <p className="text-xs text-[#617589] mt-1">Configure the types of assets tracked in your organization</p>
              </div>
              <button onClick={() => { setIsCategoryModalOpen(false); setReassigningCategory(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Add New Category */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <p className="text-[10px] font-bold text-[#617589] uppercase tracking-widest mb-3">Add New Category</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="e.g. TV Screen, CCTV Camera, Printer..."
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Reassign Modal (inline) */}
            {reassigningCategory && (
              <div className="p-4 border-b border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">swap_horiz</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      Reassign {reassigningCategory.assetCount} asset(s) from "{reassigningCategory.name}"
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      This category has assets. Choose a new category for them before deleting.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select target category...</option>
                    {categories.filter(c => c._id !== reassigningCategory._id).map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.assetCount} assets)</option>
                    ))}
                  </select>
                  <button
                    onClick={handleReassignAndDelete}
                    disabled={!reassignTargetId}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                  >
                    Move & Delete
                  </button>
                  <button
                    onClick={() => setReassigningCategory(null)}
                    className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Category List */}
            <div className="overflow-y-auto flex-1 no-scrollbar">
              {categoryLoading ? (
                <div className="p-8 text-center text-[#617589] text-sm">Loading categories...</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between px-6 py-3.5 group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      {editingCategory === cat._id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat._id)}
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateCategory(cat._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                          <button onClick={() => setEditingCategory(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                              <span className="material-symbols-outlined text-[18px]">{cat.icon || 'devices'}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#111418] dark:text-white">{cat.name}</p>
                              <div className="flex items-center gap-2">
                                {cat.isDefault && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>}
                                <span className="text-[9px] font-bold text-[#617589] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                  {cat.assetCount || 0} asset{cat.assetCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingCategory(cat._id); setEditName(cat.name); }}
                              className="p-1.5 text-[#617589] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Rename"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-[#617589] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={cat.assetCount > 0 ? `Reassign ${cat.assetCount} assets & delete` : 'Delete'}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {categories.length === 0 && !categoryLoading && (
                    <div className="p-8 text-center text-[#617589] text-sm">No categories configured yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between shrink-0">
              <p className="text-xs text-[#617589]">{categories.length} categories</p>
              <button
                onClick={() => { setIsCategoryModalOpen(false); setReassigningCategory(null); }}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
