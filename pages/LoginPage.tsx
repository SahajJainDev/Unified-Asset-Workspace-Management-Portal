import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [empId, setEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim()) return;

    try {
      setLoading(true);
      setError('');
      const employee = await apiService.getEmployee(empId.trim());
      localStorage.setItem('currentUser', JSON.stringify(employee));
      navigate('/user/verify');
    } catch (err: any) {
      setError(err.message || 'Invalid Employee ID or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col transition-colors duration-200">
      <header className="p-6 md:p-10 flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center rotate-12 shadow-sm">
          <span className="material-icons-round text-white text-lg">inventory_2</span>
        </div>
        <span className="text-slate-900 dark:text-white font-bold text-lg">Enterprise Asset Portal</span>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-8 text-center">
            {!showUserAuth ? (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="material-icons-round text-primary text-3xl">verified_user</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">SSO Authentication</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  Welcome to the Enterprise IT & Facilities Asset Management Portal. Please choose your login method.
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <span className="material-icons-round text-sm">admin_panel_settings</span>
                    <span>Sign in with Corporate SSO (Admin)</span>
                  </button>

                  <button
                    onClick={() => setShowUserAuth(true)}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-primary/20 hover:border-primary text-primary dark:text-blue-400 font-semibold py-3.5 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <span className="material-icons-round text-sm">person</span>
                    <span>Sign in with User SSO (Employee)</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setShowUserAuth(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <span className="material-icons-round text-slate-500">arrow_back</span>
                  </button>
                  <h2 className="text-xl font-bold flex-1 text-slate-900 dark:text-white">User Verification</h2>
                </div>

                <form onSubmit={handleUserLogin} className="space-y-5 text-left">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Employee ID</label>
                    <input
                      type="text"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                      placeholder="e.g. EMP001"
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !empId}
                    className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition duration-200 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Sign In Now'}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-8 flex items-center justify-center space-x-4 text-sm font-medium">
              <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition" href="#">Trouble signing in?</a>
              <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
              <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition" href="#">IT Support</a>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-slate-400 text-xs">
        &copy; 2024 AssetTrack Pro. Secure Enterprise Authentication Required.
      </footer>
    </div>
  );
};

export default LoginPage;
