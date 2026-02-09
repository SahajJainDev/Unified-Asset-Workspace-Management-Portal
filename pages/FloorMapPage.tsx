
import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Desk } from '../types';

const FloorMapPage: React.FC = () => {
    const [desks, setDesks] = useState<Desk[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState<Partial<Desk>>({});

    const fetchDesks = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/api/desks');
            if (res.ok) {
                const data = await res.json();
                setDesks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesks();
    }, []);

    // Helper for Project Colors
    const getProjectColor = (project: string) => {
        if (!project) return 'bg-gray-50 border-gray-200';

        // Hash the project string to select a color
        let hash = 0;
        for (let i = 0; i < project.length; i++) {
            hash = project.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colors = [
            'bg-blue-100 border-blue-300 text-blue-800',
            'bg-green-100 border-green-300 text-green-800',
            'bg-purple-100 border-purple-300 text-purple-800',
            'bg-amber-100 border-amber-300 text-amber-800',
            'bg-rose-100 border-rose-300 text-rose-800',
            'bg-cyan-100 border-cyan-300 text-cyan-800',
            'bg-indigo-100 border-indigo-300 text-indigo-800',
            'bg-teal-100 border-teal-300 text-teal-800'
        ];

        return colors[Math.abs(hash) % colors.length];
    };

    // Group desks by Block
    const blocks = useMemo(() => {
        const groups: Record<string, Desk[]> = {};
        desks.forEach(desk => {
            const block = desk.block || 'Unknown';
            if (!groups[block]) groups[block] = [];
            groups[block].push(desk);
        });
        // Sort blocks
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key].sort((a, b) => a.workstationId.localeCompare(b.workstationId));
            return acc;
        }, {} as Record<string, Desk[]>);
    }, [desks]);

    // Derived Stats
    const stats = useMemo(() => {
        const total = desks.length;
        const occupied = desks.filter(d => d.status === 'Occupied' || d.status === 'Permanently Assigned').length;
        const empty = desks.filter(d => d.status === 'Available').length;
        return { total, occupied, empty };
    }, [desks]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploadResult(null);
        setUploading(true);
        try {
            // New endpoint
            const res = await fetch('http://localhost:5000/api/desks/bulk-upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setUploadResult(data);
            fetchDesks();
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSeatClick = (desk: Desk) => {
        setSelectedDesk(desk);
        setEditForm({
            status: desk.status,
            empId: desk.empId || '',
            userName: desk.userName || '',
            project: desk.project || '',
            manager: desk.manager || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUnassign = async () => {
        if (!selectedDesk?._id) return;
        if (!window.confirm(`Are you sure you want to unassign seat ${selectedDesk.workstationId}?`)) return;

        try {
            // Use the dedicated hot-desk unassign endpoint which handles both Desk and Booking cleanup
            const res = await fetch(`http://localhost:5000/api/hotdesk/admin/unassign/${selectedDesk._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchDesks();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to unassign seat');
            }
        } catch (err) {
            console.error(err);
            alert('Error unassigning seat');
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedDesk?._id) return;

        try {
            const payload = {
                ...editForm,
                modifiedBy: 'Admin' // In real app, get from auth context
            };

            const res = await fetch(`http://localhost:5000/api/desks/${selectedDesk._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchDesks();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to save changes');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving changes');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="map" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold dark:text-white">Floor Map Dashboard</h2>
                            <p className="text-sm text-gray-500">Manage seat assignments visually</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            {/* Stats Summary */}
                            <div className="flex gap-4 text-xs font-bold mr-4 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex flex-col items-center px-2">
                                    <span className="text-gray-400">TOTAL</span>
                                    <span className="text-lg">{stats.total}</span>
                                </div>
                                <div className="border-r border-gray-200 dark:border-gray-700 h-8"></div>
                                <div className="flex flex-col items-center px-2">
                                    <span className="text-primary">OCCUPIED</span>
                                    <span className="text-lg">{stats.occupied}</span>
                                </div>
                                <div className="border-r border-gray-200 dark:border-gray-700 h-8"></div>
                                <div className="flex flex-col items-center px-2">
                                    <span className="text-gray-400">EMPTY</span>
                                    <span className="text-lg">{stats.empty}</span>
                                </div>
                            </div>

                            <label className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer">
                                <span className="material-symbols-outlined">upload_file</span>
                                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading map data...</div>
                    ) : desks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">map</span>
                            <p className="text-gray-500 font-medium">No floor map data found.</p>
                            <p className="text-xs text-gray-400 mt-1">Upload a CSV or Excel file to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Object.entries(blocks).map(([blockName, blockDesks]: [string, Desk[]]) => (
                                <div key={blockName} className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                        <h3 className="font-bold text-lg text-primary">Block {blockName}</h3>
                                        <span className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded text-gray-500 border border-gray-200 dark:border-gray-700">
                                            {blockDesks.length} Seats
                                        </span>
                                    </div>
                                    <div className="p-4 grid grid-cols-4 sm:grid-cols-5 gap-2 content-start flex-1">
                                        {blockDesks.map(desk => {
                                            const isOccupied = desk.status === 'Occupied' || desk.status === 'Permanently Assigned';
                                            const colorClass = isOccupied ? getProjectColor(desk.project) : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700';

                                            return (
                                                <div
                                                    key={desk._id}
                                                    onClick={() => handleSeatClick(desk)}
                                                    className={`
                                                        aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all border
                                                        ${colorClass}
                                                        ${isOccupied ? 'hover:brightness-95' : ''}
                                                    `}
                                                    title={desk.userName ? `Assigned to: ${desk.userName}\nProject: ${desk.project}` : 'Available'}
                                                >
                                                    <span className={`text-[10px] font-bold ${isOccupied ? 'text-inherit opacity-80' : 'text-gray-400'}`}>
                                                        {desk.workstationId}
                                                    </span>
                                                    {isOccupied && (
                                                        <span className="material-symbols-outlined text-[14px] opacity-70 mt-0.5">person</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex text-[10px] text-gray-400 justify-between px-4">
                                        <span>Occ: {blockDesks.filter(s => s.status !== 'Available').length}</span>
                                        <span>Avail: {blockDesks.filter(s => s.status === 'Available').length}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading Overlay */}
                {uploading && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-white text-xl font-bold">Uploading Floor Map...</h3>
                        <p className="text-white/80 text-sm">Please wait while we process your file.</p>
                    </div>
                )}

                {/* Upload Results Modal */}
                {uploadResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl w-full max-w-2xl m-4 border border-[#dbe0e6] dark:border-gray-800 flex flex-col max-h-[90vh]">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${uploadResult.summary.failed > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                        <span className="material-symbols-outlined">
                                            {uploadResult.summary.failed > 0 ? 'warning' : 'check_circle'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">Upload Complete</h3>
                                        <p className="text-xs text-gray-500">Processed {uploadResult.summary.total} records</p>
                                    </div>
                                </div>
                                <button onClick={() => setUploadResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Rows</p>
                                        <p className="text-2xl font-black text-gray-800 dark:text-white">{uploadResult.summary.total}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Desks</p>
                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{uploadResult.summary.desks || uploadResult.summary.upserted || 0}</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                                        <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold mb-1">Assets</p>
                                        <p className="text-2xl font-black text-green-600 dark:text-green-400">{uploadResult.summary.assets || 0}</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center">
                                        <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold mb-1">Failed</p>
                                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{uploadResult.summary.failed}</p>
                                    </div>
                                </div>

                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-500 uppercase">
                                            Error Log
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-white dark:bg-[#1a2632] sticky top-0">
                                                    <tr className="text-xs text-gray-400 border-b dark:border-gray-800">
                                                        <th className="px-4 py-2 font-medium">Row</th>
                                                        <th className="px-4 py-2 font-medium">Error Message</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {uploadResult.errors.map((err: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-4 py-2 font-mono text-gray-500 w-16 text-center">{err.row}</td>
                                                            <td className="px-4 py-2 text-red-600 dark:text-red-400">
                                                                {err.message}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <button
                                    onClick={() => setUploadResult(null)}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl w-full max-w-md m-4 border border-[#dbe0e6] dark:border-gray-800">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg dark:text-white">Edit Seat: {selectedDesk?.workstationId}</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                        <div className={`
                                            px-3 py-2 rounded-lg text-sm font-bold border 
                                            ${editForm.empId ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}
                                        `}>
                                            {editForm.empId ? 'Occupied' : 'Available'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">EMP ID (Editable)</label>
                                        <input
                                            className="w-full h-10 rounded-lg border border-gray-300 px-3 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={editForm.empId}
                                            onChange={e => setEditForm({ ...editForm, empId: e.target.value })}
                                            placeholder="Enter EMP ID"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">User Name (Read Only)</label>
                                    <input
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                        value={editForm.userName}
                                        readOnly
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Project (Read Only)</label>
                                        <div className="relative">
                                            <input
                                                className="w-full h-10 rounded-lg border border-gray-200 px-3 bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                value={editForm.project}
                                                readOnly
                                            />
                                            {editForm.project && (
                                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border shadow-sm ${getProjectColor(editForm.project!).split(' ')[0]}`}></div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Manager (Read Only)</label>
                                        <input
                                            className="w-full h-10 rounded-lg border border-gray-200 px-3 bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                            value={editForm.manager}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                {selectedDesk?.status !== 'Available' ? (
                                    <button
                                        onClick={handleUnassign}
                                        className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                    >
                                        Unassign Seat
                                    </button>
                                ) : (
                                    <div></div> // Spacer
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 dark:text-gray-300">Cancel</button>
                                    <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FloorMapPage;
