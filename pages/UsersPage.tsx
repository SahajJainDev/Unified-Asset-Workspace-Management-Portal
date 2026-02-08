import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import { Employee, UserRole } from '../types';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Re-use fetching logic similar to EmployeesPage, but focused on 'User' aspects
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
      } else {
        console.error('Failed to fetch employees', await res.text());
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // refetch when page, limit or searchTerm changes
  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(page, limit), 200);
    return () => clearTimeout(t);
  }, [page, limit, searchTerm]);

  const toggleAccess = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        fetchEmployees();
      }
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
      if (res.ok) {
        fetchEmployees();
      }
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newUser = {
      empId: Math.floor(Math.random() * 9000 + 1000).toString(), // Auto-gen for now if not provided, or ask user? 
      // Ideally we should ask for Emp ID. For now let's auto-gen to match previous mock behavior or add input.
      // previous mock: id: Math.floor...
      // But backend requires unique empId.
      // Let's add Emp ID input to modal to be safe, or auto-gen. 
      // Let's add a hidden field or just auto-gen in UI for simplicity if user ignores it.
      // Actually, let's keep it simple: Just name/email/role as per UI. We'll generate a random ID consistent containing 'EMP' maybe?
      // Or just use the existing behavior.

      // Let's rely on user input if we can, but the UI screenshot only shows Name, Email, Role.
      // So we will auto-generate a random 4 digit ID.
      fullName: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      userName: formData.get('userName') as string,
      isActive: true,
    };

    // We need to pass empId to backend
    const payload = {
      ...newUser,
      empId: (formData.get('card_id') as string) || Math.floor(Math.random() * 9000 + 1000).toString()
    }

    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedUser = await res.json();
        setEmployees(prev => [...prev, savedUser]);
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        alert('Failed to add user');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="users" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">User Access Management</h2>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Manage employee accounts, roles, and platform access</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
                />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">User Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                  ) : filteredEmployees.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                        {user.empId}
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/users/${user._id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 font-black">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">{user.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{user.email || 'No Email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {user.userName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role || 'Employee'}
                          onChange={(e) => user._id && changeRole(user._id, e.target.value as UserRole)}
                          className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer hover:underline p-0"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Employee">Employee</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user._id) toggleAccess(user._id, user.isActive || false);
                            }}
                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${user.isActive
                              ? 'border-red-100 text-red-500 hover:bg-red-50'
                              : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
                              }`}
                          >
                            {user.isActive ? 'Disable Access' : 'Enable Access'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredEmployees.length === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, totalCount)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> results
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

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black mb-6 dark:text-white">Add New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                  <input name="name" placeholder="Enter name..." className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email Address</label>
                  <input name="email" type="email" placeholder="email@enterprise.com" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Role</label>
                  <select name="role" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white">
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {/* Optional ID input if they want to specify */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Employee ID (Optional)</label>
                  <input name="card_id" placeholder="Auto-generated if empty" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Add User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <AIChatBot />
      </main>
    </div>
  );
};

export default UsersPage;
