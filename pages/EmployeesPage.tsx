
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AIChatBot from '../components/AIChatBot';
import { Asset, Employee, UserRole } from '../types';

const ASSET_CATEGORIES = ['All', 'Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Smartphone', 'Tablet', 'Other'] as const;

const EmployeesPage: React.FC = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Add User Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ empId: '', fullName: '', userName: '', email: '', department: '', role: 'Employee' as UserRole });
    const [userNameError, setUserNameError] = useState('');

    // Inline department editing
    const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
    const [editingDeptValue, setEditingDeptValue] = useState('');

    // Asset allocation modal
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [allocateEmployee, setAllocateEmployee] = useState<Employee | null>(null);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [assetCategory, setAssetCategory] = useState<string>('All');
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const fetchEmployees = async (p = page, l = limit) => {
        try {
            setLoading(true);
            const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : '';
            const res = await fetch(`http://localhost:5000/api/employees?page=${p}&limit=${l}${q}`);
            if (res.ok) {
                const json = await res.json();
                setEmployees(json.data || []);
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
        fetchEmployees();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchEmployees(page, limit), 200);
        return () => clearTimeout(t);
    }, [page, limit, searchTerm]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploadResult(null); 
        setUploading(true);
        try {
            const res = await fetch('http://localhost:5000/api/employees/bulk-upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setUploadResult(data);
            fetchEmployees(); 
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const toggleAccess = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) fetchEmployees();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const changeRole = async (id: string, newRole: UserRole) => {
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) fetchEmployees();
        } catch (error) {
            console.error("Failed to update role", error);
        }
    };

    const validateUserName = (value: string): boolean => {
        if (!value.trim()) {
            setUserNameError('User Name is required');
            return false;
        }
        if (!value.includes('.')) {
            setUserNameError('User Name must contain a dot (e.g. firstname.lastname)');
            return false;
        }
        const parts = value.split('.');
        if (parts.some(p => p.trim() === '')) {
            setUserNameError('User Name must have text on both sides of the dot (e.g. john.doe)');
            return false;
        }
        setUserNameError('');
        return true;
    };

    const handleAddUser = async () => {
        if (!newUser.fullName.trim()) {
            alert('Full Name is required');
            return;
        }
        if (!validateUserName(newUser.userName)) {
            return;
        }

        const payload = {
            empId: newUser.empId.trim() || String(Math.floor(Math.random() * 9000 + 1000)),
            fullName: newUser.fullName.trim(),
            userName: newUser.userName.trim(),
            email: newUser.email.trim(),
            department: newUser.department.trim(),
            role: newUser.role,
            isActive: true
        };

        try {
            const res = await fetch('http://localhost:5000/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setNewUser({ empId: '', fullName: '', userName: '', email: '', department: '', role: 'Employee' });
                setUserNameError('');
                fetchEmployees();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to add user');
            }
        } catch (error) {
            alert('Error adding user');
        }
    };

    // Stats derived from current page data
    const activeCount = employees.filter(e => e.isActive !== false).length;
    const adminCount = employees.filter(e => e.role === 'Admin').length;

    // Inline department save
    const saveDepartment = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department: editingDeptValue.trim() })
            });
            if (res.ok) fetchEmployees();
        } catch (err) {
            console.error('Failed to update department', err);
        } finally {
            setEditingDeptId(null);
        }
    };

    // Open asset allocation modal
    const openAllocateModal = async (emp: Employee) => {
        setAllocateEmployee(emp);
        setIsAllocateModalOpen(true);
        setSelectedAssetIds([]);
        setAssetCategory('All');
        setLoadingAssets(true);
        try {
            const [availRes, assignedRes] = await Promise.all([
                fetch(`http://localhost:5000/api/employees/${emp._id}/available-assets`),
                fetch(`http://localhost:5000/api/employees/${emp._id}/assets`)
            ]);
            if (availRes.ok) setAvailableAssets(await availRes.json());
            if (assignedRes.ok) setAssignedAssets(await assignedRes.json());
        } catch (err) {
            console.error('Failed to load assets', err);
        } finally {
            setLoadingAssets(false);
        }
    };

    const toggleAssetSelection = (assetId: string) => {
        setSelectedAssetIds(prev =>
            prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
        );
    };

    const assignSelectedAssets = async () => {
        if (!allocateEmployee?._id || selectedAssetIds.length === 0) return;
        setAssigning(true);
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/assign-asset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetIds: selectedAssetIds })
            });
            if (res.ok) {
                setSelectedAssetIds([]);
                // Refresh both lists
                const [availRes, assignedRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/available-assets`),
                    fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/assets`)
                ]);
                if (availRes.ok) setAvailableAssets(await availRes.json());
                if (assignedRes.ok) setAssignedAssets(await assignedRes.json());
            }
        } catch (err) {
            console.error('Failed to assign assets', err);
        } finally {
            setAssigning(false);
        }
    };

    const unassignAsset = async (assetId: string) => {
        if (!allocateEmployee?._id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/unassign-asset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId })
            });
            if (res.ok) {
                const [availRes, assignedRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/available-assets`),
                    fetch(`http://localhost:5000/api/employees/${allocateEmployee._id}/assets`)
                ]);
                if (availRes.ok) setAvailableAssets(await availRes.json());
                if (assignedRes.ok) setAssignedAssets(await assignedRes.json());
            }
        } catch (err) {
            console.error('Failed to unassign asset', err);
        }
    };

    const filteredAvailableAssets = assetCategory === 'All'
        ? availableAssets
        : availableAssets.filter(a => a.assetType === assetCategory);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="employees" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1400px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Employees & User Access</h2>
                            <p className="text-[#617589] dark:text-gray-400 text-sm">Manage employee directory, roles, and platform access</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    className="pl-10 pr-4 py-2 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
                                />
                            </div>

                            {/* Add User */}
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                                <span>Add User</span>
                            </button>

                            {/* Bulk Upload */}
                            <label className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer shadow-sm">
                                <span className="material-symbols-outlined">upload_file</span>
                                <span>{uploading ? 'Uploading...' : 'Bulk Upload'}</span>
                                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={uploading}/>
                            </label>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">groups</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider">Total Employees</p>
                                    <p className="text-2xl font-black">{totalCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider">Active Users</p>
                                    <p className="text-2xl font-black">{activeCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                    <span className="material-symbols-outlined">admin_panel_settings</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#617589] uppercase tracking-wider">Admins</p>
                                    <p className="text-2xl font-black">{adminCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                                        <th className="px-6 py-4">EMP ID</th>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">User Name</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                                    ) : employees.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">No employees found.</td></tr>
                                    ) : (
                                        employees.map((emp) => (
                                            <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                                                    {emp.empId}
                                                </td>
                                                <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/users/${emp._id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 font-black text-sm">
                                                            {emp.fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">{emp.fullName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{emp.email || 'No Email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono">
                                                    {emp.userName || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                                                    {editingDeptId === emp._id ? (
                                                        <input
                                                            autoFocus
                                                            value={editingDeptValue}
                                                            onChange={e => setEditingDeptValue(e.target.value)}
                                                            onBlur={() => emp._id && saveDepartment(emp._id)}
                                                            onKeyDown={e => { if (e.key === 'Enter' && emp._id) saveDepartment(emp._id); if (e.key === 'Escape') setEditingDeptId(null); }}
                                                            className="w-full bg-white dark:bg-slate-900 border border-primary rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="cursor-pointer hover:text-primary hover:underline inline-flex items-center gap-1 group"
                                                            onClick={() => { setEditingDeptId(emp._id || null); setEditingDeptValue(emp.department || ''); }}
                                                        >
                                                            {emp.department || <span className="text-gray-300 italic">Click to set</span>}
                                                            <span className="material-symbols-outlined text-[14px] text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={emp.role || 'Employee'}
                                                        onChange={(e) => emp._id && changeRole(emp._id, e.target.value as UserRole)}
                                                        className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer hover:underline p-0"
                                                    >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Employee">Employee</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {emp.isActive !== false ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openAllocateModal(emp); }}
                                                            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-blue-100 text-blue-500 hover:bg-blue-50 transition-all"
                                                            title="Allocate Assets"
                                                        >
                                                            Allocate
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (emp._id) toggleAccess(emp._id, emp.isActive !== false);
                                                            }}
                                                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${emp.isActive !== false
                                                                ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                                : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            {emp.isActive !== false ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

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
                                    Showing <span className="font-semibold text-gray-900 dark:text-white">{employees.length === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, totalCount)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button disabled={page <= 1} onClick={() => setPage(1)} className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center" title="First page">
                                    <span className="material-symbols-outlined text-[18px]">first_page</span>
                                </button>
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center" title="Previous">
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-2 px-4 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{page}</span>
                                    <span className="text-sm text-gray-400">/</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{totalPages}</span>
                                </div>
                                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center" title="Next">
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                                <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center" title="Last page">
                                    <span className="material-symbols-outlined text-[18px]">last_page</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading Overlay */}
                {uploading && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-white text-xl font-bold">Uploading Employees...</h3>
                    </div>
                )}

                {/* Upload Results Modal */}
                {uploadResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl w-full max-w-lg m-4 border border-[#dbe0e6] dark:border-gray-800">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg dark:text-white">Upload Complete</h3>
                                <p className="text-sm text-gray-500">Summary of processed records</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <p className="text-2xl font-bold">{uploadResult.summary.total}</p>
                                        <p className="text-xs text-gray-500 uppercase">Total</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{uploadResult.summary.upserted}</p>
                                        <p className="text-xs text-green-600 uppercase">Success</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{uploadResult.summary.failed}</p>
                                        <p className="text-xs text-red-600 uppercase">Failed</p>
                                    </div>
                                </div>
                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-xs text-red-600 max-h-32 overflow-y-auto">
                                        {uploadResult.errors.map((err: any, i: number) => (
                                            <div key={i}>Row {err.row}: {err.message}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <button onClick={() => setUploadResult(null)} className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add User Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2632] w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-[#dbe0e6] dark:border-gray-800">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-black dark:text-white">Add New User</h3>
                                <button onClick={() => { setIsAddModalOpen(false); setUserNameError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Employee ID <span className="text-gray-400 font-normal normal-case">(Auto-generated if empty)</span></label>
                                    <input 
                                        value={newUser.empId}
                                        onChange={e => setNewUser({...newUser, empId: e.target.value})}
                                        placeholder="e.g. 1042"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input 
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                                        User Name <span className="text-red-500">*</span>
                                        <span className="text-gray-400 font-normal normal-case ml-1">(must contain a dot, e.g. john.doe)</span>
                                    </label>
                                    <input 
                                        value={newUser.userName}
                                        onChange={e => {
                                            setNewUser({...newUser, userName: e.target.value});
                                            if (userNameError) validateUserName(e.target.value);
                                        }}
                                        onBlur={() => newUser.userName && validateUserName(newUser.userName)}
                                        placeholder="e.g. john.doe"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white ${userNameError ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700'}`}
                                        required
                                    />
                                    {userNameError && <p className="text-red-500 text-xs mt-1 font-medium">{userNameError}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email Address</label>
                                    <input 
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                        type="email"
                                        placeholder="email@enterprise.com"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Department</label>
                                    <input 
                                        value={newUser.department}
                                        onChange={e => setNewUser({...newUser, department: e.target.value})}
                                        placeholder="e.g. Engineering, Finance, HR"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Role</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                                <button onClick={() => { setIsAddModalOpen(false); setUserNameError(''); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 dark:text-gray-300 rounded-xl">Cancel</button>
                                <button onClick={handleAddUser} className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20">Add User</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Asset Allocation Modal */}
                {isAllocateModalOpen && allocateEmployee && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2632] w-full max-w-3xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-[#dbe0e6] dark:border-gray-800 max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-xl font-black dark:text-white">Allocate Assets</h3>
                                    <p className="text-sm text-gray-500">Assigning to <span className="font-bold text-primary">{allocateEmployee.fullName}</span> ({allocateEmployee.empId})</p>
                                </div>
                                <button onClick={() => { setIsAllocateModalOpen(false); setAllocateEmployee(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* Currently Assigned Assets */}
                                {assignedAssets.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Currently Assigned ({assignedAssets.length})</h4>
                                        <div className="space-y-2">
                                            {assignedAssets.map(asset => (
                                                <div key={asset._id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {asset.assetType === 'Laptop' ? 'laptop_mac' : asset.assetType === 'Monitor' ? 'monitor' : asset.assetType === 'Mouse' ? 'mouse' : asset.assetType === 'Keyboard' ? 'keyboard' : asset.assetType === 'Smartphone' ? 'smartphone' : asset.assetType === 'Tablet' ? 'tablet_mac' : 'devices'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold dark:text-white">{asset.assetName}</p>
                                                            <p className="text-[10px] text-gray-500">{asset.assetTag} &middot; {asset.assetType} &middot; {asset.make || ''} {asset.model || ''}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => unassignAsset(asset._id)}
                                                        className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        Unassign
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Category Tabs */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Inventory</h4>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {ASSET_CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setAssetCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${assetCategory === cat
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {cat}
                                                {cat !== 'All' && (
                                                    <span className="ml-1 opacity-70">
                                                        ({availableAssets.filter(a => a.assetType === cat).length})
                                                    </span>
                                                )}
                                                {cat === 'All' && <span className="ml-1 opacity-70">({availableAssets.length})</span>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Asset List */}
                                    {loadingAssets ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            Loading assets...
                                        </div>
                                    ) : filteredAvailableAssets.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                            No available assets{assetCategory !== 'All' ? ` in ${assetCategory}` : ''}.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                            {filteredAvailableAssets.map(asset => {
                                                const isSelected = selectedAssetIds.includes(asset._id);
                                                return (
                                                    <div
                                                        key={asset._id}
                                                        onClick={() => toggleAssetSelection(asset._id)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                                            ? 'bg-primary/5 border-primary shadow-sm'
                                                            : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:border-primary/30'
                                                        }`}
                                                    >
                                                        <div className={`size-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {isSelected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                                        </div>
                                                        <div className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {asset.assetType === 'Laptop' ? 'laptop_mac' : asset.assetType === 'Monitor' ? 'monitor' : asset.assetType === 'Mouse' ? 'mouse' : asset.assetType === 'Keyboard' ? 'keyboard' : asset.assetType === 'Smartphone' ? 'smartphone' : asset.assetType === 'Tablet' ? 'tablet_mac' : 'devices'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold dark:text-white truncate">{asset.assetName}</p>
                                                            <p className="text-[10px] text-gray-500 truncate">{asset.assetTag} &middot; {asset.assetType} &middot; {asset.make || ''} {asset.model || ''}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${asset.condition === 'New' ? 'bg-green-100 text-green-600' : asset.condition === 'Good' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {asset.condition || 'Good'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl shrink-0">
                                <p className="text-xs text-gray-500">
                                    {selectedAssetIds.length > 0
                                        ? <span className="font-bold text-primary">{selectedAssetIds.length} asset(s) selected</span>
                                        : 'Select assets from inventory to assign'
                                    }
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => { setIsAllocateModalOpen(false); setAllocateEmployee(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 dark:text-gray-300 rounded-xl">Close</button>
                                    <button
                                        onClick={assignSelectedAssets}
                                        disabled={selectedAssetIds.length === 0 || assigning}
                                        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {assigning ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                                                Assign Selected
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <AIChatBot />
            </main>
        </div>
    );
};

export default EmployeesPage;
