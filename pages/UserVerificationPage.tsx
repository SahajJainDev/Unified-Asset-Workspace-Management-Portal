import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

interface AssetVerification {
  id: string; // MongoDB ID for verification submission
  assetTag: string; // The Tag ID displayed to user
  name: string;
  expectedId: string;
  enteredId: string;
  isLost: boolean;
  type: string;
}

const UserVerificationPage: React.FC = () => {
  const [assets, setAssets] = useState<AssetVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAssets = async () => {
      try {
        setLoading(true);
        setError('');

        // Get logged-in user from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          navigate('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Fetch assets assigned to this employee's ID (empId)
        const data = await apiService.getAssetsByEmployee(userData.empId);

        const inferAssetType = (asset: any): string => {
          // If assetType is already set and not the default 'Laptop', use it
          if (asset.assetType && asset.assetType !== 'Laptop') {
            return asset.assetType;
          }

          // Infer from asset name or tag
          const name = (asset.assetName || '').toLowerCase();
          const tag = (asset.assetTag || '').toLowerCase();

          if (name.includes('keyboard') || name.includes('keys') || tag.startsWith('key-')) return 'Keyboard';
          if (name.includes('mouse') || name.includes('mx master') || tag.startsWith('mou-')) return 'Mouse';
          if (name.includes('monitor') || name.includes('display') || name.includes('ultrasharp') || tag.startsWith('mon-')) return 'Monitor';
          if (name.includes('ipad') || name.includes('tablet') || tag.startsWith('tab-')) return 'Tablet';
          if (name.includes('iphone') || name.includes('phone') || name.includes('smartphone') || tag.startsWith('phone-')) return 'Smartphone';
          if (name.includes('macbook') || name.includes('laptop') || name.includes('thinkpad') || name.includes('elitebook') || tag.startsWith('lap-')) return 'Laptop';

          // Default to the original assetType from DB
          return asset.assetType || 'Laptop';
        };

        const mappedAssets = data.map((a: any) => ({
          id: a._id,
          assetTag: a.assetTag,
          name: a.assetName,
          expectedId: a.assetTag,
          enteredId: '',
          isLost: false,
          type: inferAssetType(a)
        }));
        setAssets(mappedAssets);
      } catch (err: any) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load your assigned assets. Please contact IT.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAssets();
  }, [navigate]);

  const handleIdChange = (id: string, value: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, enteredId: value, isLost: false } : a));
  };

  const handleMarkLost = (id: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, isLost: !a.isLost, enteredId: '' } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Submit each verification with real data
      await Promise.all(assets.map(asset =>
        apiService.submitVerification({
          assetId: asset.id,
          enteredAssetId: asset.enteredId || (asset.isLost ? 'REPORTED_LOST' : ''),
          employeeId: user.empId,
          status: asset.isLost ? 'Flagged' : (asset.enteredId === asset.expectedId ? 'Verified' : 'Pending'),
          notes: asset.isLost ? 'Reported lost by user' : (asset.enteredId !== asset.expectedId ? 'ID Mismatch reported by user' : '')
        })
      ));
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to submit verification. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark">
        <UserSidebar activeTab="verify" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="size-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <span className="material-symbols-outlined text-5xl">verified</span>
            </div>
            <h2 className="text-3xl font-black">Verification Submitted</h2>
            <p className="text-[#617589]">Thank you, {user?.fullName || 'Employee'}, for completing your quarterly asset attestation. Your IT records have been updated.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <UserSidebar activeTab="verify" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1000px] w-full mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-primary font-black text-xs uppercase tracking-widest mb-1">Welcome back, {user?.fullName || 'Employee'}</p>
              <h1 className="text-4xl font-black tracking-tight">Verify Your Assets</h1>
              <p className="text-[#617589] mt-1">Quarterly hardware compliance check for {user?.department || 'your department'}.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#617589]">Fetching your assigned assets...</div>
          ) : assets.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2632] p-12 rounded-[2rem] border border-[#dbe0e6] dark:border-gray-800 text-center space-y-4">
              <div className="size-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="text-xl font-bold">No Assets Found</h3>
              <p className="text-[#617589] max-w-sm mx-auto">We couldn't find any hardware assets assigned to your profile. If you believe this is an error, please contact IT Support.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`bg-white dark:bg-[#1a2632] p-6 rounded-[2rem] border transition-all duration-300 ${asset.isLost ? 'border-red-200 dark:border-red-900/50 bg-red-50/10' :
                      asset.enteredId === asset.expectedId ? 'border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/5' :
                        'border-[#dbe0e6] dark:border-gray-800 shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center ${asset.isLost ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                          }`}>
                          <span className="material-symbols-outlined">{
                            asset.type === 'Laptop' ? 'laptop_mac' :
                              asset.type === 'Monitor' ? 'desktop_windows' :
                                asset.type === 'Mouse' ? 'mouse' :
                                  asset.type === 'Keyboard' ? 'keyboard' :
                                    asset.type === 'Smartphone' ? 'smartphone' :
                                      asset.type === 'Tablet' ? 'tablet' :
                                        asset.type === 'Charger' ? 'charging_station' :
                                          asset.type === 'Other' ? 'devices' : 'inventory_2'
                          }</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[#617589] uppercase tracking-widest">{asset.type}</p>
                          <h3 className="text-lg font-black">{asset.name}</h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkLost(asset.id)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter transition-all ${asset.isLost ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-600'
                          }`}
                      >
                        {asset.isLost ? 'Reported Lost' : 'Mark Lost'}
                      </button>
                    </div>

                    {!asset.isLost && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest">Verify Your Asset ID</label>
                          <span className="text-[10px] font-bold text-primary font-mono opacity-60">Hint: PTU1DELL0111</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={asset.enteredId}
                            onChange={(e) => handleIdChange(asset.id, e.target.value.toUpperCase())}
                            placeholder="Enter ID printed on Asset..."
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          />
                          {asset.enteredId === asset.expectedId && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                              <span className="material-symbols-outlined">check_circle</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {asset.isLost && (
                      <div className="p-4 rounded-xl bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">An IT ticket will be opened automatically in Quixr to initiate replacement procedures.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-primary p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 mt-12 shadow-2xl shadow-primary/30">
                <div className="flex items-center gap-6">
                  <div className="size-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-4xl">assignment_turned_in</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black">Final Attestation</h4>
                    <p className="text-blue-100 text-sm">By clicking submit, I confirm that the asset information provided is accurate.</p>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-12 py-5 bg-white text-primary rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Complete Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserVerificationPage;
