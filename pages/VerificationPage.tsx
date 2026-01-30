
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const VerificationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <Header />
      <main className="flex-1 flex justify-center py-10 px-4 md:px-0">
        <div className="max-w-[800px] w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="mb-8">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Quarterly Asset Verification</h1>
            <p className="text-[#617589] dark:text-gray-400 text-base mt-2">Please confirm the IT assets assigned to you for security compliance.</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 rounded-2xl bg-white dark:bg-[#1a2632] p-6 shadow-sm border border-[#dbe0e6] dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Correctly Assigned</span>
                  <p className="text-lg font-bold">MacBook Pro 16" (M2 Max)</p>
                </div>
                <p className="text-[#617589] text-sm">Serial: C02F1234MD6R | Assigned: Jan 2023</p>
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm">This is mine</button>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#617589] text-xs font-bold rounded-lg">Not my asset</button>
                </div>
              </div>
              <div 
                className="w-full md:w-48 h-32 bg-cover bg-center rounded-xl border border-gray-100 dark:border-gray-800" 
                style={{backgroundImage: 'url("https://picsum.photos/seed/mac/300/200")'}}
              ></div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 rounded-2xl bg-white dark:bg-[#1a2632] p-6 shadow-sm border border-[#dbe0e6] dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pending Confirmation</span>
                  <p className="text-lg font-bold">Logitech MX Master 3</p>
                </div>
                <p className="text-[#617589] text-sm">Serial: 2115LZ0478X | Assigned: Mar 2023</p>
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm">This is mine</button>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#617589] text-xs font-bold rounded-lg">Not my asset</button>
                </div>
              </div>
              <div 
                className="w-full md:w-48 h-32 bg-cover bg-center rounded-xl border border-gray-100 dark:border-gray-800" 
                style={{backgroundImage: 'url("https://picsum.photos/seed/mouse/300/200")'}}
              ></div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 dark:bg-primary/5 border border-blue-100 dark:border-primary/20 p-6 rounded-2xl mt-8">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div>
                <p className="font-bold">Security Attestation</p>
                <p className="text-sm text-[#617589]">I confirm all assets above are in my possession and properly secured.</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
               <input type="checkbox" id="attest" className="size-6 rounded text-primary focus:ring-primary mr-2 align-middle"/>
               <label htmlFor="attest" className="text-sm font-bold text-gray-700 dark:text-gray-300">I agree</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pb-20">
            <Link to="/" className="px-6 py-3 bg-[#f0f2f4] dark:bg-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</Link>
            <button className="px-10 py-3 bg-primary text-white text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Submit Verification</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerificationPage;
