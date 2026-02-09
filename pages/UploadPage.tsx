
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface UploadResult {
  summary: {
    total: number;
    inserted: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    message: string;
    data: any;
  }>;
}

const UploadPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep(2); // Move to review step
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStep(2);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/assets/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setStep(3); // Move to result step
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="upload" />
      <main className="flex-1 overflow-y-auto p-10 max-w-5xl mx-auto flex flex-col justify-center animate-in fade-in duration-500 no-scrollbar">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-4">Bulk Data Upload Wizard</h1>
          <p className="text-[#617589]">Import your hardware and software asset lists into the system.</p>
        </div>

        <div className="grid grid-cols-4 gap-8 items-start">
          <aside className="col-span-1 space-y-4">
            {[
              { s: 1, label: 'Upload File', icon: 'upload_file' },
              { s: 2, label: 'Review & Import', icon: 'rebase_edit' },
              { s: 3, label: 'Results', icon: 'fact_check' },
            ].map((item) => (
              <div 
                key={item.s} 
                className={`bg-white dark:bg-[#1a2632] p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  step === item.s ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-200 dark:border-gray-800 opacity-60'
                }`}
              >
                <div className={`size-8 rounded-full flex items-center justify-center text-sm ${
                  step === item.s || step > item.s ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">{step > item.s ? 'check' : item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Step {item.s}</p>
                  <p className={`font-bold text-sm truncate ${step === item.s ? 'text-primary' : 'text-gray-500'}`}>{item.label}</p>
                </div>
              </div>
            ))}
          </aside>

          <div className="col-span-3 bg-white dark:bg-[#1a2632] p-8 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-xl min-h-[400px] flex flex-col">
            {step === 1 && (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-6">Select source file to upload</h3>
                <div 
                  className="border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl py-20 flex flex-col items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange}
                  />
                  <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Drag and drop XLSX here</p>
                    <p className="text-sm text-[#617589]">Files must be standard Excel format</p>
                  </div>
                  <button className="bg-primary text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-primary/20 mt-2">Browse Files</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-6">Ready to Import</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 mb-6">
                  <div className="size-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                     <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{file?.name}</p>
                    <p className="text-sm text-gray-500">{(file?.size ? (file.size / 1024).toFixed(2) : 0)} KB</p>
                  </div>
                  <button onClick={() => { setFile(null); setStep(1); }} className="ml-auto text-red-500 hover:bg-red-50 p-2 rounded-full">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm mb-6">
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    <span className="material-symbols-outlined">info</span>
                    Processing Info
                  </div>
                  <p>The file will be processed immediately. Valid rows will be added to the database. Invalid rows will be skipped and reported.</p>
                </div>
              </div>
            )}

            {step === 3 && result && (
               <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                 <h3 className="text-xl font-bold mb-6">Upload Results</h3>
                 
                 <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-center">
                        <p className="text-gray-500 text-sm font-bold uppercase">Total Rows</p>
                        <p className="text-3xl font-black">{result.summary.total}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-100 dark:border-green-900">
                        <p className="text-green-600 dark:text-green-400 text-sm font-bold uppercase">Successfully Added</p>
                        <p className="text-3xl font-black text-green-600 dark:text-green-400">{result.summary.inserted}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-100 dark:border-red-900">
                        <p className="text-red-600 dark:text-red-400 text-sm font-bold uppercase">Failed</p>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400">{result.summary.failed}</p>
                    </div>
                 </div>

                 {result.errors.length > 0 && (
                   <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold sticky top-0">
                          <tr>
                            <th className="p-3">Row</th>
                            <th className="p-3">Error</th>
                            <th className="p-3">Data Dump</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, i) => (
                            <tr key={i} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                              <td className="p-3 font-mono">{err.row}</td>
                              <td className="p-3 text-red-600">{err.message}</td>
                              <td className="p-3 text-gray-400 text-xs truncate max-w-[200px]">{JSON.stringify(err.data)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 )}
                 {result.errors.length === 0 && (
                   <div className="flexflex-col items-center justify-center text-center py-10 text-green-600">
                      <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                      <p className="text-xl font-bold">All assets imported successfully!</p>
                   </div>
                 )}
               </div>
            )}

            <div className="mt-auto pt-8 flex justify-between">
              <Link to="/assets" className="text-gray-500 font-bold py-2 hover:text-gray-700 transition-colors">Cancel</Link>
              <div className="flex gap-4">
                {step === 2 && (
                   <button 
                     onClick={() => setStep(1)}
                     className="px-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                   >
                     Back
                   </button>
                )}
                {step === 2 && (
                  <button 
                    onClick={uploadFile}
                    disabled={loading}
                    className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                    {loading ? 'Processsing...' : 'Start Import'}
                  </button>
                )}
                {step === 3 && (
                   <button 
                     onClick={() => navigate('/assets')}
                     className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                   >
                     Return to Assets
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
