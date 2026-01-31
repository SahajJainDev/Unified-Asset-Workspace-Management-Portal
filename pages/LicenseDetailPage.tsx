
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import apiService, { License } from '../services/apiService';

const LicenseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLicense();
    }, [id]);

    const fetchLicense = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data = await apiService.getLicense(id);
            setLicense(data);
            setFormData(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load license details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            if (!id) return;
            const updated = await apiService.updateLicense(id, formData);
            setLicense(updated);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save changes');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this license?')) {
            try {
                if (!id) return;
                await apiService.deleteLicense(id);
                navigate('/licenses');
            } catch (err) {
                console.error(err);
                alert('Failed to delete license');
            }
        }
    };

    if (loading) return <div className="p-10 dark:text-white">Loading...</div>;
    if (!license && !loading) return <div className="p-10 dark:text-white">License not found</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="licenses" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1280px] w-full mx-auto px-4 md:px-10 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                        <Link className="text-[#617589] text-sm font-medium hover:text-primary transition-colors" to="/licenses">Licenses</Link>
                        <span className="text-[#617589] text-sm">/</span>
                        <span className="text-primary text-sm font-semibold">{license.licenseKey || 'Details'}</span>
                    </div>

                    <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="size-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                    <span className="material-symbols-outlined text-4xl">key</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-[#111418] dark:text-white text-2xl font-bold">{license.softwareName}</h1>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${new Date(license.expiryDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {new Date(license.expiryDate) < new Date() ? 'Expired' : 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-[#617589] text-sm font-normal">Version: {license.version || 'Web-based'} | Key: <span className="font-mono">{license.licenseKey}</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-bold rounded-lg transition-all hover:bg-gray-200">Cancel</button>
                                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">
                                            <span className="material-symbols-outlined text-sm">save</span>
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-bold rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            Edit
                                        </button>
                                        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">License Information</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Software Name', name: 'softwareName', value: license.softwareName, type: 'text' },
                                    { label: 'Version', name: 'version', value: license.version, type: 'text' },
                                    { label: 'License Key', name: 'licenseKey', value: license.licenseKey, type: 'text' },
                                    { label: 'Seats Limit', name: 'seatsLimit', value: license.seatsLimit, type: 'number' },
                                ].map((field, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">{field.label}</label>
                                        {isEditing ? (
                                            <input name={field.name} type={field.type} value={formData[field.name] || ''} onChange={handleChange} className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        ) : (
                                            <span className="text-sm font-bold">{field.value || '-'}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Management Details</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Invoice Number', name: 'invoiceNumber', value: license.invoiceNumber, type: 'text' },
                                    { label: 'Added By', name: 'addedBy', value: license.addedBy, type: 'text' },
                                    { label: 'Assigned System', name: 'assignedSystem', value: license.assignedSystem, type: 'text' },
                                ].map((field, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">{field.label}</label>
                                        {isEditing ? (
                                            <input name={field.name} type={field.type} value={formData[field.name] || ''} onChange={handleChange} className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        ) : (
                                            <span className="text-sm font-bold">{field.value || '-'}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Lifespan</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Start Date', name: 'startDate', value: license.startDate, type: 'date' },
                                    { label: 'Expiry Date', name: 'expiryDate', value: license.expiryDate, type: 'date' },
                                ].map((field, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">{field.label}</label>
                                        {isEditing ? (
                                            <input name={field.name} type={field.type} value={formData[field.name] ? new Date(formData[field.name]).toISOString().split('T')[0] : ''} onChange={handleChange} className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        ) : (
                                            <span className="text-sm font-bold">{field.value ? new Date(field.value).toLocaleDateString() : '-'}</span>
                                        )}
                                    </div>
                                ))}
                                {!isEditing && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-400">Total Duration</span>
                                            <span>{license.startDate && license.expiryDate ? `${Math.ceil((new Date(license.expiryDate).getTime() - new Date(license.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} Years` : '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <AIChatBot />
            </main>
        </div>
    );
};

export default LicenseDetailPage;
