
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const installedSoftware = [
    { name: 'Adobe Creative Cloud', version: 'v2024.1', date: 'Jan 15, 2024', status: 'Compliant' },
    { name: 'Slack Desktop', version: 'v4.35.0', date: 'Feb 02, 2024', status: 'Compliant' },
    { name: 'VS Code', version: 'v1.86.1', date: 'Jan 20, 2024', status: 'Update Avail.' },
    { name: 'SentinelOne Agent', version: 'v23.2', date: 'Jan 01, 2024', status: 'Secured' },
  ];

  // Integrated history items from Quikr logs
  const historyItems = [
    { date: 'Mar 20, 2024', event: 'Quikr Modification', desc: 'Battery health reported as 94% via Quikr auto-scan.', icon: 'bolt', color: 'bg-primary/10 text-primary' },
    { date: 'Oct 12, 2023', event: 'Asset Assigned', desc: 'Assigned to Sarah Jenkins for Product Design role.', icon: 'person_add', color: 'bg-blue-100 text-blue-600' },
    { date: 'Sep 28, 2023', event: 'Provisioned', desc: 'Installed standard design suite and security patches.', icon: 'settings', color: 'bg-green-100 text-green-600' },
    { date: 'Sep 25, 2023', event: 'Purchased', desc: 'Ordered from Apple Enterprise Store.', icon: 'shopping_cart', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="assets" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1280px] w-full mx-auto px-4 md:px-10 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Link className="text-[#617589] text-sm font-medium hover:text-primary transition-colors" to="/assets">Assets</Link>
            <span className="text-[#617589] text-sm">/</span>
            <span className="text-primary text-sm font-semibold">{id || 'Asset-042'}</span>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-32 w-32 border border-gray-100 dark:border-gray-800 shadow-inner" 
                  style={{backgroundImage: 'url("https://picsum.photos/seed/macbook/200/200")'}}
                ></div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-[#111418] dark:text-white text-2xl font-bold leading-tight">MacBook Pro 16" - Asset {id || 'IT-042'}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-primary text-xs font-bold uppercase tracking-wider">In Use</span>
                  </div>
                  <p className="text-[#617589] text-base font-normal">Assigned to <span className="text-[#111418] dark:text-white font-medium">Sarah Jenkins</span> (Product Design)</p>
                  <p className="text-[#617589] text-sm font-normal mt-1">Serial: C02FX555LVDL | Tag: {id || 'ASSET-8821'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-slate-800 text-[#111418] dark:text-white text-sm font-bold border border-transparent hover:border-gray-300 transition-all">
                  <span className="material-symbols-outlined">edit</span>
                  <span>Edit</span>
                </button>
                <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                  <span className="material-symbols-outlined">logout</span>
                  <span>Reassign</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Procurement Details</h3>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Invoice Number</span>
                   <span className="font-bold text-primary">INV-2023-0428</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Added By</span>
                   <span className="font-bold">Alex Rivera</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Purchased On</span>
                   <span className="font-medium">Sep 12, 2023</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Vendor</span>
                   <span className="font-medium">Apple Enterprise</span>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Specs</h3>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Processor</span>
                   <span className="font-medium">Apple M2 Max</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Memory</span>
                   <span className="font-medium">32 GB</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Battery Health</span>
                   <span className="font-bold text-green-500">94%</span>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Location Info</h3>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Zone</span>
                   <span className="font-medium">HQ - SF / Wing B</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Desk ID</span>
                   <span className="font-medium">B-102</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#617589]">Last Seen</span>
                   <span className="font-medium">Today, 09:42 AM</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Installed Software Section */}
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Installed Software</h3>
                  <button className="text-xs font-bold text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">Manage Apps</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-[#617589] uppercase tracking-wider">
                        <th className="pb-3 px-2">Software Name</th>
                        <th className="pb-3 px-2">Version</th>
                        <th className="pb-3 px-2">Last Scan</th>
                        <th className="pb-3 px-2 text-right">Security</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {installedSoftware.map((sw, i) => (
                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800/20">
                          <td className="py-3 px-2 text-sm font-bold">{sw.name}</td>
                          <td className="py-3 px-2 text-xs text-[#617589] font-mono">{sw.version}</td>
                          <td className="py-3 px-2 text-xs text-[#617589]">{sw.date}</td>
                          <td className="py-3 px-2 text-right">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              sw.status === 'Compliant' ? 'bg-green-100 text-green-700' :
                              sw.status === 'Secured' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {sw.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Lifecycle History</h3>
                <div className="space-y-6">
                  {historyItems.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== historyItems.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-100 dark:bg-gray-800 -z-0"></div>}
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 z-10 ${step.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                      </div>
                      <div className="pb-2">
                        <p className="text-xs font-semibold text-[#617589]">{step.date}</p>
                        <p className="text-sm font-bold">{step.event}</p>
                        <p className="text-xs text-[#617589] mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4">Asset Tag QR</h3>
                <div className="aspect-square bg-white dark:bg-gray-100 rounded-lg flex items-center justify-center p-6 border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {/* Mock QR placeholder */}
                  <div className="size-full border-4 border-black dark:border-slate-800 border-double opacity-20 flex items-center justify-center relative">
                     <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-slate-500 font-bold text-xs bg-slate-50 dark:bg-gray-800 rounded-lg hover:bg-slate-100 transition-colors">Download QR Tag</button>
              </div>

              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4">Attachments</h3>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <span className="text-xs font-bold truncate">purchase_invoice_428.pdf</span>
                   </div>
                   <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                      <span className="material-symbols-outlined text-amber-500">verified</span>
                      <span className="text-xs font-bold truncate">warranty_cert.pdf</span>
                   </div>
                </div>
                <button className="w-full mt-4 py-2 border border-dashed border-gray-300 dark:border-gray-700 text-slate-400 font-bold text-[10px] uppercase rounded-lg hover:border-primary hover:text-primary transition-all">Upload File</button>
              </div>
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>
    </div>
  );
};

export default AssetDetailPage;
