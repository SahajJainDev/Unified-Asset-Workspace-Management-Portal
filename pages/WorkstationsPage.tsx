
import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import { Workstation, User } from '../types';

const INITIAL_WORKSTATIONS: Workstation[] = [
  { id: 'WS-101', location: 'HQ - Wing A / Floor 4', seatNumber: 'A-21', status: 'Occupied', assignedEmployeeId: '1907' },
  { id: 'WS-102', location: 'HQ - Wing A / Floor 4', seatNumber: 'A-22', status: 'Available' },
  { id: 'WS-103', location: 'HQ - Wing B / Floor 2', seatNumber: 'B-05', status: 'Available' },
];

const MOCK_USERS: User[] = [
  { id: '1907', name: 'Sarah Rose', email: 'sarah.rose@enterprise.com', role: 'Employee', isActive: true, workstationId: 'WS-101' },
  { id: '1738', name: 'Michael Chen', email: 'michael.c@enterprise.com', role: 'Employee', isActive: true },
  { id: '1306', name: 'John Doe', email: 'john.doe@enterprise.com', role: 'Employee', isActive: true },
];

const WorkstationsPage: React.FC = () => {
  const [workstations, setWorkstations] = useState<Workstation[]>(INITIAL_WORKSTATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workstation | null>(null);
  const [assigningWs, setAssigningWs] = useState<Workstation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setWorkstations(prev => prev.filter(ws => ws.id !== id));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newWs: Workstation = {
      id: (formData.get('id') as string) || `WS-${Math.floor(Math.random() * 900) + 100}`,
      location: formData.get('location') as string,
      seatNumber: formData.get('seatNumber') as string,
      status: (formData.get('status') as any) || 'Available',
      assignedEmployeeId: (formData.get('employeeId') as string) || undefined,
    };

    if (editingWs) {
      setWorkstations(prev => prev.map(ws => ws.id === editingWs.id ? newWs : ws));
    } else {
      setWorkstations(prev => [...prev, newWs]);
    }
    setIsModalOpen(false);
    setEditingWs(null);
  };

  const handleAssign = (userId: string) => {
    setError(null);
    if (!assigningWs) return;

    // Validation: Check if employee already has a workstation
    const alreadyAssigned = workstations.find(ws => ws.assignedEmployeeId === userId && ws.id !== assigningWs.id);
    if (alreadyAssigned) {
      setError("This employee is already assigned to another workstation.");
      return;
    }

    setWorkstations(prev => prev.map(ws => 
      ws.id === assigningWs.id 
        ? { ...ws, status: 'Occupied', assignedEmployeeId: userId } 
        : ws
    ));
    setAssigningWs(null);
  };

  const handleRelease = (id: string) => {
    setWorkstations(prev => prev.map(ws => 
      ws.id === id ? { ...ws, status: 'Available', assignedEmployeeId: undefined } : ws
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="workstations" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight leading-tight">Workstation Management</h2>
              <p className="text-[#617589] dark:text-gray-400 text-sm">Organize floor seating and workstation assignments</p>
            </div>
            <button 
              onClick={() => { setEditingWs(null); setIsModalOpen(true); }}
              className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-md hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Workstation</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">WS ID</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Seat #</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {workstations.map((ws) => (
                    <tr key={ws.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{ws.id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{ws.location}</td>
                      <td className="px-6 py-4 text-sm">{ws.seatNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ws.status === 'Occupied' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{ws.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ws.assignedEmployeeId ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{MOCK_USERS.find(u => u.id === ws.assignedEmployeeId)?.name}</span>
                            <button onClick={() => handleRelease(ws.id)} className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase">Release</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssigningWs(ws)} className="text-primary hover:underline text-xs font-bold">Assign Employee</button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingWs(ws); setIsModalOpen(true); }} className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button onClick={() => handleDelete(ws.id)} className="p-1 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black mb-6">{editingWs ? 'Edit Workstation' : 'Add Workstation'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Workstation ID</label>
                  <input name="id" defaultValue={editingWs?.id} placeholder="e.g. WS-105" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Location</label>
                  <input name="location" defaultValue={editingWs?.location} placeholder="Building / Floor / Zone" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Seat Number</label>
                  <input name="seatNumber" defaultValue={editingWs?.seatNumber} placeholder="e.g. A-42" className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Popup */}
        {assigningWs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black mb-2">Assign Workstation</h3>
              <p className="text-sm text-slate-500 mb-6">Select an employee for workstation <span className="font-bold text-primary">{assigningWs.id}</span></p>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MOCK_USERS.map(user => (
                  <button 
                    key={user.id} 
                    onClick={() => handleAssign(user.id)}
                    className="w-full p-3 flex items-center justify-between bg-slate-50 dark:bg-gray-900 hover:bg-primary/5 hover:border-primary/30 border border-transparent rounded-xl transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold group-hover:text-primary">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role} #{user.id}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">person_add</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setAssigningWs(null)} className="w-full mt-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        )}

        <AIChatBot />
      </main>
    </div>
  );
};

export default WorkstationsPage;
