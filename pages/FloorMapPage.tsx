
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AIChatBot from '../components/AIChatBot';
import { Workstation, User, Floor } from '../types';
import apiService, { createWorkstation, updateWorkstation, deleteWorkstation } from '../services/apiService';



const FloorMapPage: React.FC = () => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState('A');
  const [zoom, setZoom] = useState(1);
  const [assetsModalEmployeeId, setAssetsModalEmployeeId] = useState<string | null>(null);
  
  const [isWsModalOpen, setIsWsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workstation | null>(null);
  const [assigningWsId, setAssigningWsId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Fetch floor data on component mount
  React.useEffect(() => {
    const fetchFloorData = async () => {
      try {
        setLoading(true);
        const floorData = await apiService.getFloors();
        setFloors(floorData);

        // Flatten all workstations from all floors
        const floorWorkstations = floorData.flatMap(floor =>
          floor.workstations?.map(ws => ({
            ...ws,
            floor: floor._id,
            location: `${floor.building} - Floor ${floor.level}`
          })) || []
        );

        // Also fetch standalone workstations not assigned to any floor
        try {
          const allWorkstationsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/floors/workstations`);
          if (allWorkstationsResponse.ok) {
            const allWorkstationsData = await allWorkstationsResponse.json();
            const standaloneWorkstations = allWorkstationsData
              .filter((ws: any) => !ws.floor)
              .map((ws: any) => ({
                ...ws,
                location: 'Not assigned to a floor'
              }));

            setWorkstations([...floorWorkstations, ...standaloneWorkstations]);
          } else {
            // If the API call fails, just use floor workstations
            setWorkstations(floorWorkstations);
          }
        } catch (err) {
          // If there's an error, just use floor workstations
          console.warn('Could not fetch standalone workstations:', err);
          setWorkstations(floorWorkstations);
        }
      } catch (err) {
        setError('Failed to load floor map data');
        console.error('Error fetching floor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFloorData();
  }, []);

  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const stats = useMemo(() => {
    const total = workstations.length;
    const occupied = workstations.filter(ws => ws.status === 'Occupied').length;
    const vacant = total - occupied;
    const percent = Math.round((occupied / total) * 100) || 0;
    return { total, occupied, vacant, percent };
  }, [workstations]);

  const visibleWorkstations = useMemo(() => {
    return workstations.filter(ws => {
      if (searchQuery) {
        return ws.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
               ws.workstationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (ws.assignedEmployeeId && ws.assignedEmployeeId.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return ws.floorType === currentSection;
    });
  }, [currentSection, searchQuery, workstations]);

  const handleSaveWorkstation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const workstationId = formData.get('workstationId') as string;
      const floorType = formData.get('floorType') as string;

      const workstationData = {
        workstationId,
        seatNumber: workstationId, // Auto-set to workstationId
        floorType,
        status: editingWs?.status || 'Available',
        assignedEmployeeId: editingWs?.assignedEmployeeId,
        isActive: editingWs?.isActive ?? true
      };

      if (editingWs) {
        await apiService.updateWorkstation(editingWs._id!, workstationData);
      } else {
        await apiService.createWorkstation(workstationData);
      }

      // Refresh data
      const floorData = await apiService.getFloors();
      setFloors(floorData);
      const floorWorkstations = floorData.flatMap(floor =>
        floor.workstations?.map(ws => ({
          ...ws,
          floor: floor._id,
          location: `${floor.building} - Floor ${floor.level}`
        })) || []
      );

      // Also fetch standalone workstations not assigned to any floor
      try {
        const allWorkstationsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/floors/workstations`);
        if (allWorkstationsResponse.ok) {
          const allWorkstationsData = await allWorkstationsResponse.json();
          const standaloneWorkstations = allWorkstationsData
            .filter((ws: any) => !ws.floor)
            .map((ws: any) => ({
              ...ws,
              location: 'Not assigned to a floor'
            }));

          setWorkstations([...floorWorkstations, ...standaloneWorkstations]);
        } else {
          // If the API call fails, just use floor workstations
          setWorkstations(floorWorkstations);
        }
      } catch (err) {
        // If there's an error, just use floor workstations
        console.warn('Could not fetch standalone workstations:', err);
        setWorkstations(floorWorkstations);
      }

      setIsWsModalOpen(false);
      setEditingWs(null);
    } catch (err) {
      console.error('Error saving workstation:', err);
      setError('Failed to save workstation');
    }
  };

  const handleDeleteWorkstation = async (workstationId: string) => {
    if (window.confirm(`Delete workstation ${workstationId}?`)) {
      try {
        const ws = workstations.find(w => w.workstationId === workstationId);
        if (ws) {
          await apiService.deleteWorkstation(ws._id!);
        }

        // Refresh data
        const floorData = await apiService.getFloors();
        setFloors(floorData);
        const floorWorkstations = floorData.flatMap(floor =>
          floor.workstations?.map(ws => ({
            ...ws,
            floor: floor._id,
            location: `${floor.building} - Floor ${floor.level}`
          })) || []
        );

        // Also fetch standalone workstations not assigned to any floor
        const allWorkstationsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/floors/workstations`);
        const allWorkstationsData = await allWorkstationsResponse.json();
        const standaloneWorkstations = allWorkstationsData
          .filter((ws: any) => !ws.floor)
          .map((ws: any) => ({
            ...ws,
            location: 'Not assigned to a floor'
          }));

        setWorkstations([...floorWorkstations, ...standaloneWorkstations]);
        setSelectedWsId(null);
      } catch (err) {
        console.error('Error deleting workstation:', err);
        setError('Failed to delete workstation');
      }
    }
  };

  const handleAssignUser = async (userId: string) => {
    setAssignError(null);
    if (!assigningWsId) return;

    // Validation: Check if employee is already assigned elsewhere
    const alreadyAssigned = workstations.find(ws => ws.assignedEmployeeId === userId && ws.workstationId !== assigningWsId);
    if (alreadyAssigned) {
      setAssignError("This employee is already assigned to another workstation.");
      return;
    }

    try {
      const ws = workstations.find(w => w.workstationId === assigningWsId);
      if (ws) {
        await apiService.updateWorkstation(ws._id!, { assignedEmployeeId: userId, status: 'Occupied' });

        // Refresh data
        const floorData = await apiService.getFloors();
        setFloors(floorData);
        const floorWorkstations = floorData.flatMap(floor =>
          floor.workstations?.map(ws => ({
            ...ws,
            floor: floor._id,
            location: `${floor.building} - Floor ${floor.level}`
          })) || []
        );

        // Also fetch standalone workstations not assigned to any floor
        const allWorkstationsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/floors/workstations`);
        const allWorkstationsData = await allWorkstationsResponse.json();
        const standaloneWorkstations = allWorkstationsData
          .filter((ws: any) => !ws.floor)
          .map((ws: any) => ({
            ...ws,
            location: 'Not assigned to a floor'
          }));

        setWorkstations([...floorWorkstations, ...standaloneWorkstations]);
      }
    } catch (err) {
      console.error('Error assigning user:', err);
      setError('Failed to assign user');
    }

    setAssigningWsId(null);
  };

  const handleRelease = async (id: string) => {
    try {
      await updateWorkstation(id, { assignedEmployeeId: null, status: 'Available' });

      // Refresh data
      const floorData = await apiService.getFloors();
      setFloors(floorData);
      const allWorkstations = floorData.flatMap(floor =>
        floor.workstations?.map(ws => ({
          ...ws,
          floor: floor._id,
          location: `${floor.building} - Floor ${floor.level}`
        })) || []
      );
      setWorkstations(allWorkstations);
    } catch (err) {
      console.error('Error releasing workstation:', err);
      setError('Failed to release workstation');
    }
  };

  const selectedWs = workstations.find(ws => ws.workstationId === selectedWsId);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar activeTab="map" />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading floor map...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar activeTab="map" />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="map" />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Management Sidebar */}
          <aside className="w-80 bg-white dark:bg-[#1a2632] border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar shrink-0">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-black tracking-tight">Floor Map</h2>
                <button 
                  onClick={() => { setEditingWs(null); setIsWsModalOpen(true); }}
                  className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  title="Add Workstation"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <p className="text-xs text-[#617589] font-bold uppercase tracking-widest">Office Seating Allocation</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find seat, ID, or user..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              {!searchQuery && (
                <div className="grid grid-cols-4 gap-2">
                  {sections.map(s => (
                    <button 
                      key={s}
                      onClick={() => { setCurrentSection(s); setSelectedWsId(null); }}
                      className={`py-3 rounded-xl text-xs font-black transition-all ${
                        currentSection === s 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupancy</p>
                <p className="text-2xl font-black mt-1">{stats.percent}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                <p className="text-2xl font-black mt-1 text-emerald-500">{stats.vacant}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs font-bold">
                 <div className="flex items-center gap-2"><div className="size-3 rounded bg-primary"></div><span>Occupied</span></div>
                 <span className="text-slate-400 font-mono">{stats.occupied}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                 <div className="flex items-center gap-2"><div className="size-3 rounded bg-emerald-500"></div><span>Vacant</span></div>
                 <span className="text-slate-400 font-mono">{stats.vacant}</span>
              </div>
            </div>
          </aside>

          {/* Map Viewer */}
          <main className="flex-1 overflow-hidden grid-bg flex flex-col bg-slate-50 dark:bg-[#0d1117] relative">
            <div className="absolute top-8 right-8 z-[100] flex flex-col gap-2">
              <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))} className="size-12 rounded-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button onClick={() => setZoom(1)} className="size-12 rounded-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all text-[10px] font-black">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} className="size-12 rounded-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-12 lg:p-20 no-scrollbar">
              <div className="w-full max-w-[1400px] mx-auto space-y-8 origin-top transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
                <div className="flex justify-between items-end mb-4">
                   <div>
                      <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-400 dark:text-gray-700">
                        {searchQuery ? `Searching for: "${searchQuery}"` : `Section ${currentSection}`}
                      </h1>
                      <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
                        Showing {visibleWorkstations.length} workstations
                      </p>
                   </div>
                </div>

                <div className="bg-white dark:bg-[#1a2632] rounded-[3rem] p-10 lg:p-16 border border-slate-200 dark:border-gray-800 shadow-2xl relative">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                    {visibleWorkstations.map((ws) => (
                      <div 
                        key={ws.id}
                        onClick={() => setSelectedWsId(ws.id === selectedWsId ? null : ws.id)}
                        className={`h-24 rounded-3xl flex flex-col items-center justify-center transition-all relative cursor-pointer hover:scale-105 active:scale-95 shadow-sm ${
                          selectedWsId === ws.id ? 'ring-4 ring-primary ring-offset-8 dark:ring-offset-[#1a2632] z-[60] scale-110 shadow-2xl' : ''
                        } ${
                          ws.status === 'Occupied' ? 'bg-primary text-white shadow-primary/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'
                        }`}
                      >
                        <span className="material-icons-round text-lg mb-1 opacity-80">
                          {ws.status === 'Occupied' ? 'person' : 'check_circle'}
                        </span>
                        <span className="text-[10px] font-black tracking-tighter uppercase whitespace-nowrap">
                          {ws.seatNumber}
                        </span>
                        {ws.status === 'Occupied' && (
                          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-1">
                            ID: {ws.assignedEmployeeId}
                          </span>
                        )}

                        {/* Station Detail Popup */}
                        {selectedWsId === ws.id && (
                          <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-80 bg-white dark:bg-[#1a2632] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 z-[100] animate-in fade-in zoom-in slide-in-from-bottom-4 cursor-default text-left" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">STATION DETAILS</p>
                                 <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{ws.seatNumber}</h3>
                                 <p className="text-[10px] font-bold text-primary font-mono mt-1">ID: {ws.id}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingWs(ws); setIsWsModalOpen(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 hover:text-primary transition-colors">
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button onClick={() => handleDeleteWorkstation(ws.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                                <button onClick={() => setSelectedWsId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-slate-400">
                                   <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                              </div>
                            </div>

                            <div className="p-4 rounded-2xl mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-gray-800">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LOCATION</p>
                               <p className="text-xs font-bold">{ws.location || 'Not assigned to a floor'}</p>
                            </div>

                            {ws.status === 'Occupied' ? (
                              <div className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                       <span className="material-symbols-outlined">badge</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ASSIGNED EMPLOYEE</p>
                                       <p className="text-sm font-black truncate text-slate-900 dark:text-white">Employee</p>
                                       <p className="text-xs font-bold text-slate-400">ID: {ws.assignedEmployeeId}</p>
                                    </div>
                                    <button onClick={() => handleRelease(ws.id)} className="text-[10px] font-black text-red-500 uppercase hover:underline">Release</button>
                                 </div>
                                 <div className="flex gap-3">
                                   <button 
                                     onClick={() => setAssetsModalEmployeeId(ws.assignedEmployeeId!)}
                                     className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all"
                                   >
                                      Assets
                                   </button>
                                   <button 
                                     onClick={() => setAssigningWsId(ws.id)}
                                     className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                                   >
                                      Reassign
                                   </button>
                                 </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                 <p className="text-xs text-slate-400 font-bold leading-relaxed">This workstation is available for allocation.</p>
                                 <button onClick={() => setAssigningWsId(ws.id)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Assign User</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Floating AI Chat Bot */}
        <AIChatBot />
      </div>

      {/* Asset List Modal */}
      {assetsModalEmployeeId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setAssetsModalEmployeeId(null)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Assigned Assets</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Employee ID: {assetsModalEmployeeId}</p>
              </div>
              <button onClick={() => setAssetsModalEmployeeId(null)} className="size-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              <p className="text-center text-slate-400 text-sm font-bold py-10 italic">Assets data not available. Please fetch from API.</p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-gray-800/30">
               <button onClick={() => setAssetsModalEmployeeId(null)} className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Workstation Modal */}
      {isWsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsWsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6">{editingWs ? 'Edit Workstation' : 'Add Workstation'}</h3>
            <form onSubmit={handleSaveWorkstation} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Workstation ID</label>
                  <input
                    name="workstationId"
                    defaultValue={editingWs?.workstationId || ''}
                    placeholder="e.g. A-42"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                    onChange={(e) => {
                      // Auto-fill seat number when workstation ID changes
                      const seatNumberInput = e.target.form?.seatNumber as HTMLInputElement;
                      if (seatNumberInput) {
                        seatNumberInput.value = e.target.value;
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seat Number</label>
                  <input
                    name="seatNumber"
                    defaultValue={editingWs?.seatNumber || ''}
                    placeholder="Auto-filled from Workstation ID"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Floor Type</label>
                  <input
                    name="floorType"
                    defaultValue={editingWs?.floorType || ''}
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                    pattern="^[A-Z]$"
                    title="Floor Type must be a single uppercase letter (A-Z)"
                    maxLength={1}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsWsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20">Save Station</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Popup */}
      {assigningWsId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setAssigningWsId(null)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-2">Assign Station</h3>
            <p className="text-sm text-slate-400 mb-6">Select employee for station <span className="font-black text-primary">{workstations.find(w => w.id === assigningWsId)?.seatNumber}</span></p>
            
            {assignError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                <p className="text-xs font-bold leading-relaxed">{assignError}</p>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              <p className="text-center text-slate-400 text-sm font-bold py-10 italic">User data not available. Please fetch from API.</p>
            </div>
            <button onClick={() => setAssigningWsId(null)} className="w-full mt-6 py-4 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorMapPage;
