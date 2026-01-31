import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import { Employee, Asset, UserRole } from '../types';

const UserDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<Employee | null>(null);
    const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserDetails();
        }
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            // GET User by ID
            const userRes = await fetch(`http://localhost:5000/api/employees/${id}`);
            if (!userRes.ok) throw new Error("User not found");
            const userData = await userRes.json();
            setUser(userData);

            // GET Assigned Assets
            // Assuming assetRoutes supports filtering by assignedTo (Emp ID)
            if (userData.empId) {
                const assetsRes = await fetch(`http://localhost:5000/api/assets?assignedTo=${userData.empId}`);
                if (assetsRes.ok) {
                    const assetsData = await assetsRes.json();
                    setAssignedAssets(assetsData);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load user details");
            navigate('/users');
        } finally {
            setLoading(false);
        }
    };

    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [unassignedAssets, setUnassignedAssets] = useState<Asset[]>([]);
    const [editForm, setEditForm] = useState({ fullName: '', empId: '' });

    const fetchUnassignedAssets = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/assets?status=Available'); // Assuming 'Available' is the status for unassigned
            if (res.ok) {
                setUnassignedAssets(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch unassigned assets", error);
        }
    };

    const handleAllocateClick = () => {
        fetchUnassignedAssets();
        setIsAllocateModalOpen(true);
    };

    const confirmAllocateAsset = async (asset: Asset) => {
        if (!user) return;
        try {
            // Construct update payload for Asset
            const updatePayload = {
                ...asset,
                status: 'Assigned',
                assignedTo: user.empId, // Legacy field
                // assignments usually require employee object too
                employee: {
                    number: user.empId,
                    name: user.fullName,
                    department: user.department || '',
                    subDepartment: '' // Optional or fetched if available
                },
                assignmentDate: new Date().toISOString()
            };

            const res = await fetch(`http://localhost:5000/api/assets/${asset._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (res.ok) {
                setIsAllocateModalOpen(false);
                fetchUserDetails(); // Refresh both user and assets
            } else {
                alert("Failed to allocate asset");
            }
        } catch (error) {
            console.error(error);
            alert("Error allocating asset");
        }
    };

    const handleEditClick = () => {
        if (user) {
            setEditForm({ fullName: user.fullName, empId: user.empId });
            setIsEditModalOpen(true);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?._id) return;

        try {
            const res = await fetch(`http://localhost:5000/api/employees/${user._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchUserDetails();
            } else {
                alert("Failed to update user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async () => {
        if (!user?._id || !window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/employees/${user._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                navigate('/users');
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting user");
        }
    };

    const handleStatusChange = async () => {
        if (!user?._id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/employees/${user._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive })
            });
            if (res.ok) {
                setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReleaseAsset = async (assetId: string) => {
        // Release logic - set asset status to Available or similar, remove assignment
        // Currently no specific endpoint for "release", but we can update asset
        try {
            // Create a copy of asset with empty assignment
            // fetch asset first to be safe, or just overwrite fields
            const assetToRelease = assignedAssets.find(a => a._id === assetId);
            if (!assetToRelease) return;

            const updatedAsset = {
                ...assetToRelease,
                status: 'Available', // or whatever 'Available' status is
                employee: { number: '', name: '', department: '', subDepartment: '' },
                assignedTo: '' // Legacy
            };

            const res = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
                method: 'PUT', // or PATCH
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAsset)
            });

            if (res.ok) {
                // remove from list
                setAssignedAssets(prev => prev.filter(a => a._id !== assetId));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-background-light dark:bg-background-dark items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="users" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Top Section: User Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-white dark:bg-[#1a2632] p-8 rounded-2xl shadow-sm border border-[#dbe0e6] dark:border-gray-800">
                        <div className="flex items-center gap-6">
                            <div className="size-20 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 font-black text-3xl">
                                {user.fullName.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{user.fullName}</h2>
                                    <span className="text-xl text-gray-400 font-bold">#{user.empId}</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{user.email || 'No email'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAllocateClick}
                                className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Allocate New Asset
                            </button>
                            <button
                                onClick={handleEditClick}
                                className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold gap-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Edit User
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="flex items-center justify-center rounded-lg h-10 px-4 bg-red-50 text-red-600 text-sm font-bold gap-2 border border-red-100 shadow-sm hover:bg-red-100 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Delete User
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Details */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 p-6">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">User Details</h3>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Employee ID</p>
                                        <p className="font-mono font-bold text-gray-700 dark:text-gray-200">{user.empId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email</p>
                                        <p className="font-bold text-gray-700 dark:text-gray-200">{user.email || '-'}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Role</p>
                                                <p className="font-bold text-primary">{user.role || 'Employee'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Status</p>
                                                <button
                                                    onClick={handleStatusChange}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block cursor-pointer hover:opacity-80 transition-opacity ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                    {user.isActive ? 'Active' : 'Disabled'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Duplicate details content as per design image showing repetition? Or maybe different section. 
                         The design shows "User Details" and "Assigned Assets" as tabs, but then shows both panels below?
                         Actually, the design shows "User Details" and "Assigned Assets" as tabs on the left panel, AND a large "Assigned Assets" panel on the right.
                         I'll stick to a clean layout: Left panel = User Info, Right Panel = Assets List.
                     */}
                        </div>

                        {/* Right Column: Assigned Assets */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
                                <div className="p-6 border-b border-[#dbe0e6] dark:border-gray-800">
                                    <h3 className="text-xl font-bold dark:text-white">Assigned Assets</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Asset ID</th>
                                                <th className="px-6 py-4">Asset Name</th>
                                                <th className="px-6 py-4">Asset Type</th>
                                                <th className="px-6 py-4">Assigned Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                                            {assignedAssets.length === 0 ? (
                                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-bold">No assets assigned</td></tr>
                                            ) : assignedAssets.map(asset => (
                                                <tr key={asset._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-gray-500">{asset.assetTag}</td>
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{asset.assetName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{asset.assetType || 'Laptop'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{asset.assignmentDate || '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleReleaseAsset(asset._id)}
                                                            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all"
                                                        >
                                                            RELEASE
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allocate Asset Modal */}
                    {isAllocateModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#1a2632] w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black dark:text-white">Allocate Asset</h3>
                                    <button onClick={() => setIsAllocateModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <span className="material-symbols-outlined text-gray-500">close</span>
                                    </button>
                                </div>
                                <div className="overflow-y-auto flex-1 -mx-2 px-2">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase font-bold tracking-wider sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Asset Tag</th>
                                                <th className="px-4 py-3">Asset Name</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                                            {unassignedAssets.length === 0 ? (
                                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 font-bold">No unassigned assets found</td></tr>
                                            ) : unassignedAssets.map(asset => (
                                                <tr key={asset._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                                    <td className="px-4 py-3 font-mono text-sm font-bold text-gray-500">{asset.assetTag}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{asset.assetName}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{asset.assetType || '-'}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => confirmAllocateAsset(asset)}
                                                            className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            Select
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit User Modal */}
                    {isEditModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#1a2632] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                                <h3 className="text-xl font-black mb-6 dark:text-white">Edit User Details</h3>
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                                        <input
                                            value={editForm.fullName}
                                            onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Employee ID</label>
                                        <input
                                            value={editForm.empId}
                                            onChange={e => setEditForm({ ...editForm, empId: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                                        <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
                <AIChatBot />
            </main>
        </div>
    );
};

export default UserDetailsPage;
