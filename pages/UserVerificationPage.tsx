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
  isSubmitted: boolean;
  isSubmitting: boolean;
}

const UserVerificationPage: React.FC = () => {
  const [assets, setAssets] = useState<AssetVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [noCycle, setNoCycle] = useState(false);
  const [activeCycle, setActiveCycle] = useState<any>(null);
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

        // 1. Check for active verification cycle
        const cycle = await apiService.getActiveCycle();
        if (!cycle) {
          setNoCycle(true);
          setLoading(false);
          return;
        }
        setActiveCycle(cycle);

        // 2. Get list of already submitted assets for this cycle
        const submittedData = await apiService.getSubmittedAssetsForCycle(cycle._id, userData.empId);
        const submittedAssetIds = new Set(submittedData.assetIds);

        // 3. Fetch assets assigned to this employee's ID (empId)
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
          type: inferAssetType(a),
          isSubmitted: submittedAssetIds.has(a._id),
          isSubmitting: false
        }));
        setAssets(mappedAssets);
        
        // Check if all assets have been submitted
        if (mappedAssets.length > 0 && mappedAssets.every((a: AssetVerification) => a.isSubmitted)) {
          setAllSubmitted(true);
        }
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
    if (!user || !activeCycle) return;

    // Only submit unverified assets
    const unverifiedAssets = assets.filter(a => !a.isSubmitted);
    if (unverifiedAssets.length === 0) {
      setSubmitted(true);
      return;
    }

    try {
      const verifications = unverifiedAssets.map(asset => ({
        assetId: asset.id,
        enteredAssetId: asset.enteredId || (asset.isLost ? 'REPORTED_LOST' : ''),
        status: asset.isLost ? 'Flagged' : (asset.enteredId === asset.expectedId ? 'Verified' : 'Pending'),
        notes: asset.isLost ? 'Reported lost by user' : (asset.enteredId !== asset.expectedId ? 'ID Mismatch reported by user' : '')
      }));

      await apiService.submitBatchVerification(user.empId, activeCycle._id, verifications);

      setAssets(prev => prev.map(a => ({ ...a, isSubmitted: true })));
      setSubmitted(true);
    } catch (err: any) {
      console.error('Submit failed:', err);
      alert(err.message || 'Failed to submit verification. Please try again.');
    }
  };

  const handleVerifySingleAsset = async (assetId: string) => {
    if (!user || !activeCycle) return;

    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.isSubmitted) return;

    if (!asset.isLost && !asset.enteredId.trim()) {
      alert('Please enter the asset ID or mark it as lost.');
      return;
    }

    try {
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isSubmitting: true } : a));

      await apiService.submitVerification({
        assetId: asset.id,
        enteredAssetId: asset.enteredId || (asset.isLost ? 'REPORTED_LOST' : ''),
        employeeId: user.empId,
        status: asset.isLost ? 'Flagged' : (asset.enteredId === asset.expectedId ? 'Verified' : 'Pending'),
        notes: asset.isLost ? 'Reported lost by user' : (asset.enteredId !== asset.expectedId ? 'ID Mismatch reported by user' : ''),
        cycleId: activeCycle._id
      });

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isSubmitted: true, isSubmitting: false } : a));

      // Check if all are now submitted
      const updatedAssets = assets.map(a => a.id === assetId ? { ...a, isSubmitted: true } : a);
      if (updatedAssets.every(a => a.isSubmitted)) {
        setAllSubmitted(true);
      }
    } catch (err: any) {
      console.error('Submit failed:', err);
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isSubmitting: false } : a));

      if (err.message?.includes('already submitted')) {
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isSubmitted: true, isSubmitting: false } : a));
      } else {
        alert(err.message || 'Failed to submit verification. Please try again.');
      }
    }
  };

  // No active cycle state
  if (!loading && noCycle) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark">
        <UserSidebar activeTab="verify" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="size-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mx-auto">
              <span className="material-symbols-outlined text-5xl">event_busy</span>
            </div>
            <h2 className="text-3xl font-black text-[#111418] dark:text-white">No Active Verification</h2>
            <p className="text-[#617589]">There is currently no active asset verification cycle. You'll be notified by your IT admin when the next verification period begins.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">info</span>
                Check back later or contact your administrator for details.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // All assets already verified state
  if (!loading && allSubmitted) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark">
        <UserSidebar activeTab="verify" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="size-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <span className="material-symbols-outlined text-5xl">task_alt</span>
            </div>
            <h2 className="text-3xl font-black text-[#111418] dark:text-white">All Assets Verified</h2>
            <p className="text-[#617589]">
              You have successfully verified all {assets.length} assigned assets{activeCycle ? ` for "${activeCycle.title}"` : ''}. Thank you for completing the attestation.
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">check_circle</span>
                All your assets have been verified. No further action is needed for this cycle.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <p className="text-[#617589]">Thank you, {user?.fullName || 'Employee'}, for completing your asset attestation{activeCycle ? ` for "${activeCycle.title}"` : ''}. Your IT records have been updated.</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">lock</span>
                Your verification is locked. You cannot re-submit for this cycle.
              </p>
            </div>
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
              <p className="text-[#617589] mt-1">
                {activeCycle ? activeCycle.title : 'Hardware compliance check'} for {user?.department || 'your department'}.
              </p>
            </div>
            <div className="bg-white dark:bg-[#1a2632] px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="size-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">badge</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#617589] uppercase tracking-tighter">Employee ID</p>
                <p className="text-sm font-bold">{user?.empId || '---'}</p>
              </div>
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
                    className={`bg-white dark:bg-[#1a2632] p-6 rounded-[2rem] border transition-all duration-300 ${
                      asset.isSubmitted ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-900/10' :
                      asset.isLost ? 'border-red-200 dark:border-red-900/50 bg-red-50/10' :
                      asset.enteredId === asset.expectedId ? 'border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/5' :
                        'border-[#dbe0e6] dark:border-gray-800 shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center ${
                          asset.isSubmitted ? 'bg-emerald-100 text-emerald-600' :
                          asset.isLost ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                          }`}>
                          <span className="material-symbols-outlined">{
                            asset.isSubmitted ? 'check_circle' :
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
                          {asset.isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[10px]">verified</span>
                              Submitted
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkLost(asset.id)}
                        disabled={asset.isSubmitted}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter transition-all ${
                          asset.isSubmitted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' :
                          asset.isLost ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-600'
                          }`}
                      >
                        {asset.isLost ? 'Reported Lost' : 'Mark Lost'}
                      </button>
                    </div>

                    {asset.isSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                          This asset has been verified and locked for this cycle.
                        </p>
                      </div>
                    ) : !asset.isLost ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-[#617589] uppercase tracking-widest">Verify Asset ID</label>
                          <span className="text-[10px] font-bold text-primary font-mono opacity-60">Hint: {asset.expectedId}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={asset.enteredId}
                            onChange={(e) => handleIdChange(asset.id, e.target.value.toUpperCase())}
                            placeholder="Enter ID printed on tag..."
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          />
                          {asset.enteredId === asset.expectedId && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                              <span className="material-symbols-outlined">check_circle</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerifySingleAsset(asset.id)}
                          disabled={asset.isSubmitting || (!asset.enteredId.trim() && !asset.isLost)}
                          className="w-full px-5 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {asset.isSubmitting ? (
                            <>
                              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">send</span>
                              Verify This Asset
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 space-y-3">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">An IT ticket will be opened automatically in Quixr to initiate replacement procedures.</p>
                        <button
                          type="button"
                          onClick={() => handleVerifySingleAsset(asset.id)}
                          disabled={asset.isSubmitting}
                          className="w-full px-5 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {asset.isSubmitting ? (
                            <>
                              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">report</span>
                              Report Lost Asset
                            </>
                          )}
                        </button>
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
                    <p className="text-blue-100 text-sm">
                      {assets.filter(a => !a.isSubmitted).length > 0 
                        ? `Submit all remaining ${assets.filter(a => !a.isSubmitted).length} asset(s) for verification.`
                        : 'All assets have been verified. You can review them above.'}
                    </p>
                  </div>
                </div>
                {assets.filter(a => !a.isSubmitted).length > 0 && (
                  <button
                    type="submit"
                    className="w-full md:w-auto px-12 py-5 bg-white text-primary rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Complete Verification ({assets.filter(a => !a.isSubmitted).length})
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserVerificationPage;
