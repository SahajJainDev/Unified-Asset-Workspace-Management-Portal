
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import apiService from '../services/apiService';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const [results, setResults] = useState<{ assets: any[], software: any[], licenses: any[] }>({
        assets: [],
        software: [],
        licenses: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                setLoading(true);
                try {
                    const data = await apiService.searchGlobal(query);
                    setResults(data);
                } catch (err) {
                    console.error("Search failed:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchResults();
        }
    }, [query]);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar activeTab="" />
            <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                <Header />
                <div className="max-w-[1000px] w-full mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black tracking-tight">Search Results</h1>
                        <p className="text-[#617589] mt-2">Showing results for "<span className="text-primary font-bold">{query}</span>"</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Assets Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                                    <h2 className="text-xl font-bold">Assets ({results.assets.length})</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {results.assets.map((asset) => (
                                        <div
                                            key={asset._id}
                                            onClick={() => navigate(`/assets/${asset.assetTag}`)}
                                            className="bg-white dark:bg-[#1a2632] p-4 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 hover:border-primary transition-all cursor-pointer flex justify-between items-center"
                                        >
                                            <div>
                                                <h3 className="font-bold text-sm">{asset.assetName}</h3>
                                                <p className="text-xs text-[#617589] mt-1">{asset.assetTag} • {asset.model}</p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase italic">{asset.status}</span>
                                        </div>
                                    ))}
                                    {results.assets.length === 0 && <p className="text-xs text-[#617589] italic ml-8">No matching assets found</p>}
                                </div>
                            </section>

                            {/* Software Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-purple-500">terminal</span>
                                    <h2 className="text-xl font-bold">Software ({results.software.length})</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {results.software.map((sw) => (
                                        <div
                                            key={sw._id}
                                            onClick={() => navigate(`/licenses?software=${encodeURIComponent(sw.name)}`)}
                                            className="bg-white dark:bg-[#1a2632] p-4 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 hover:border-primary transition-all cursor-pointer flex justify-between items-center"
                                        >
                                            <div>
                                                <h3 className="font-bold text-sm">{sw.name}</h3>
                                                <p className="text-xs text-[#617589] mt-1">{sw.version} • {sw.usedSeats}/{sw.totalSeats} Seats</p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                        </div>
                                    ))}
                                    {results.software.length === 0 && <p className="text-xs text-[#617589] italic ml-8">No matching software found</p>}
                                </div>
                            </section>

                            {/* Licenses Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-amber-500">key</span>
                                    <h2 className="text-xl font-bold">Licenses ({results.licenses.length})</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {results.licenses.map((license) => (
                                        <div
                                            key={license._id}
                                            onClick={() => navigate(`/licenses/${license._id}`)}
                                            className="bg-white dark:bg-[#1a2632] p-4 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 hover:border-primary transition-all cursor-pointer flex justify-between items-center"
                                        >
                                            <div>
                                                <h3 className="font-bold text-sm">{license.softwareName}</h3>
                                                <p className="text-xs text-[#617589] mt-1">{license.licenseKey} • {license.assignedSystem || 'Not Assigned'}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                        </div>
                                    ))}
                                    {results.licenses.length === 0 && <p className="text-xs text-[#617589] italic ml-8">No matching licenses found</p>}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchResultsPage;
