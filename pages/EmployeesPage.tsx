
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Employee } from '../types';

const EmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ empId: '', fullName: '' });

    const fetchEmployees = async (p = page, l = limit) => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/employees?page=${p}&limit=${l}`);
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
        fetchEmployees(page, limit);
    }, [page, limit]);

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

    const handleAddEmployee = async () => {
        if (!newEmployee.empId || !newEmployee.fullName) {
            alert('Please fill all fields');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setNewEmployee({ empId: '', fullName: '' });
                fetchEmployees();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to add employee');
            }
        } catch (error) {
            alert('Error adding employee');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="employees" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold dark:text-white">Employees</h2>
                            <p className="text-sm text-gray-500">Manage employee directory</p>
                        </div>
                        <div className="flex gap-4 items-center">
                             <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Add Employee
                            </button>

                            <label className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer">
                                <span className="material-symbols-outlined">upload_file</span>
                                <span>{uploading ? 'Uploading...' : 'Upload Excel'}</span>
                                <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} disabled={uploading}/>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-[#dbe0e6] dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">EMP ID</th>
                                    <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Full Name</th>
                                    <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Added On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No employees found.</td></tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-3 font-mono text-primary font-medium">{emp.empId}</td>
                                            <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">{emp.fullName}</td>
                                            <td className="px-6 py-3 text-gray-500">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination controls */}
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
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{employees.length === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, totalCount)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> results
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
                                {uploadResult.errors.length > 0 && (
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

                {/* Add Employee Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl w-full max-w-md m-4 border border-[#dbe0e6] dark:border-gray-800">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg dark:text-white">Add New Employee</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">EMP ID <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full h-10 rounded-lg border border-gray-300 px-3 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={newEmployee.empId}
                                        onChange={e => setNewEmployee({...newEmployee, empId: e.target.value})}
                                        placeholder="e.g. 1042"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full h-10 rounded-lg border border-gray-300 px-3 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={newEmployee.fullName}
                                        onChange={e => setNewEmployee({...newEmployee, fullName: e.target.value})}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 dark:text-gray-300">Cancel</button>
                                <button onClick={handleAddEmployee} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20">Add Employee</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeesPage;
