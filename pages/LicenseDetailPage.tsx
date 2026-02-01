
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import apiService, { License } from '../services/apiService';

const LicenseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLicense();
    }, [id]);

    const fetchLicense = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data = await apiService.getLicense(id);
            setLicense(data);
            // TODO: Fetch assigned users for this license
            setAssignedUsers([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this license?')) {
            try {
                if (!id) return;
                await apiService.deleteLicense(id);
                navigate('/licenses');
            } catch (err) {
                console.error(err);
                alert('Failed to delete license');
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    if (loading) return <div className="p-10 dark:text-white">Loading...</div>;
    if (!license && !loading) return <div className="p-10 dark:text-white">License not found</div>;

    const utilizationPercentage = license.seatsLimit > 0
        ? Math.round((assignedUsers.length / license.seatsLimit) * 100)
        : 0;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="licenses" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1280px] w-full mx-auto px-4 md:px-10 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Header */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 mb-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <span className="material-symbols-outlined text-3xl">key</span>
                                </div>
                                <div>
                                    <h1 className="text-[#111418] dark:text-white text-2xl font-bold">{license.softwareName} <span className="text-slate-400 font-normal text-lg">v{license.version || '1'}</span></h1>
                                    <p className="text-[#617589] text-sm">Software License</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit License
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete License
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                        <div className="border-b border-[#dbe0e6] dark:border-gray-800 px-6">
                            <div className="flex gap-8">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    License Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Assigned Users
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'details' ? (
                                <div className="space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total Seats</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{license.seatsLimit || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Seats Utilized</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{assignedUsers.length}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">License Key</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{license.licenseKey || 'N/A'}</p>
                                                <button
                                                    onClick={() => copyToClipboard(license.licenseKey)}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-primary text-sm">content_copy</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Utilization Bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">License Utilization:</p>
                                            <p className="text-sm font-bold text-slate-500">{utilizationPercentage}%</p>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                style={{ width: `${utilizationPercentage}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{assignedUsers.length} / {license.seatsLimit} Seats ({utilizationPercentage}% Utilized)</p>
                                    </div>

                                    {/* License Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase">License Information</h3>
                                            {[
                                                { label: 'Software Name', value: license.softwareName },
                                                { label: 'Version', value: license.version || 'N/A' },
                                                { label: 'License Type', value: 'Commercial' },
                                                { label: 'Invoice Number', value: license.invoiceNumber || 'N/A' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-sm text-slate-500">{item.label}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase">Validity Period</h3>
                                            {[
                                                { label: 'Start Date', value: license.startDate ? new Date(license.startDate).toLocaleDateString() : 'N/A' },
                                                { label: 'Expiry Date', value: license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A' },
                                                { label: 'Added By', value: license.addedBy || 'N/A' },
                                                { label: 'Assigned System', value: license.assignedSystem || 'N/A' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-sm text-slate-500">{item.label}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* Assigned Users Tab */}
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="relative flex-1 max-w-md">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search user..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                            Assign License
                                        </button>
                                    </div>

                                    {assignedUsers.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                                <span className="material-symbols-outlined text-5xl text-slate-400">folder_open</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No users assigned yet</h3>
                                            <p className="text-sm text-slate-500 mb-4">Use the 'Assign License' button to add users to this license.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                                        <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Employee ID</th>
                                                        <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">User</th>
                                                        <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Email</th>
                                                        <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {assignedUsers.map((user, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                            <td className="py-3 px-2 text-sm font-mono text-slate-500">{user.empId}</td>
                                                            <td className="py-3 px-2 text-sm font-bold">{user.name}</td>
                                                            <td className="py-3 px-2 text-sm text-slate-500">{user.email}</td>
                                                            <td className="py-3 px-2 text-right">
                                                                <button className="text-xs font-bold text-red-500 hover:text-red-700">Remove</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <AIChatBot />
            </main>

            {/* Edit Modal - Reuse AddLicenseModal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2632] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit License</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <span className="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500">Edit functionality will be integrated with AddLicenseModal component</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LicenseDetailPage;
