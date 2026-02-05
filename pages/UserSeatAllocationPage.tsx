import React, { useState, useEffect } from 'react';
import UserSidebar from '../components/UserSidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const UserSeatAllocationPage: React.FC = () => {
   const [user, setUser] = useState<any>(null);
   const [desk, setDesk] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      const fetchUserData = async () => {
         try {
            setLoading(true);
            const storedUser = localStorage.getItem('currentUser');
            if (!storedUser) {
               navigate('/login');
               return;
            }
            const userData = JSON.parse(storedUser);
            setUser(userData);

            try {
               const deskData = await apiService.getDeskByEmployee(userData.empId);
               setDesk(deskData);
            } catch (err) {
               console.log("No desk found for user");
            }
         } catch (err) {
            console.error("Error loading user data:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchUserData();
   }, [navigate]);

   return (
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
         <UserSidebar activeTab="seat" />
         <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
            <Header />
            <div className="max-w-[1000px] w-full mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-10">
                  <h1 className="text-4xl font-black tracking-tight">Seat Allocation</h1>
                  <p className="text-[#617589] mt-2">Manage your workstation and floor placement.</p>
               </div>

               {loading ? (
                  <div className="text-center py-20 text-[#617589]">Loading seat details...</div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#1a2632] rounded-[2.5rem] border border-[#dbe0e6] dark:border-gray-800 shadow-xl overflow-hidden">
                           <div className="p-8 border-b border-slate-50 dark:border-gray-800">
                              <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">CURRENT WORKSTATION</p>
                              <h2 className="text-5xl font-black text-primary">{desk?.workstationId || 'Not Assigned'}</h2>
                           </div>
                           <div className="p-8 space-y-8">
                              <div className="flex flex-wrap gap-8">
                                 <div>
                                    <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">ZONE</p>
                                    <p className="font-bold text-lg">{desk ? `Block ${desk.block}` : '---'}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">DEPARTMENT</p>
                                    <p className="font-bold text-lg">{user?.department || 'General'}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest mb-1">TYPE</p>
                                    <p className="font-bold text-lg">{desk?.project || 'Shared Space'}</p>
                                 </div>
                              </div>

                              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                       <span className="material-symbols-outlined">info</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">Need to move? Contact Facilities Management for seat change requests.</p>
                                 </div>
                                 <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Request Move</button>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-white dark:bg-[#1a2632] p-8 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                           <h3 className="text-lg font-black mb-4">Floor Preview</h3>
                           <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-gray-800 flex items-center justify-center grid-bg relative">
                              <div className="size-12 bg-primary rounded-xl shadow-2xl shadow-primary/40 flex items-center justify-center text-white font-black animate-pulse">
                                 {desk?.workstationId || '---'}
                              </div>
                              <div className="absolute top-4 left-4 size-4 rounded-full bg-slate-200"></div>
                              <div className="absolute top-4 right-4 size-4 rounded-full bg-slate-200"></div>
                              <div className="absolute bottom-4 left-4 size-4 rounded-full bg-slate-200"></div>
                              <div className="absolute bottom-4 right-4 size-4 rounded-full bg-slate-200"></div>
                           </div>
                           <p className="text-[10px] text-center font-bold text-[#617589] mt-4 uppercase tracking-widest">{desk ? `Block ${desk.block}` : 'Floor Map'} Preview</p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </main>
      </div>
   );
};

export default UserSeatAllocationPage;
