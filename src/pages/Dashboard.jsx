import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, TrendingUp, Clock, Server, Database, Activity, Calendar, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // all, today, yesterday, 7days

    const fetchFromApi = async (isManualRefresh = false, signal = null) => {
        try {
            // Always show loading on explicit refresh or if we have no data
            if (isManualRefresh || !data) setLoading(true);

            const [statsResponse, statusResponse] = await Promise.all([
                api.get(`/admin/dashboard?timeFilter=${timeFilter}`, { signal }),
                api.get('/admin/system-status', { signal })
            ]);

            if (statsResponse.data.success) {
                setData(statsResponse.data);
                await adminDB.set(`dashboard_${timeFilter}`, statsResponse.data);
                markFetched(`dashboard_${timeFilter}`);
            }
            if (statusResponse.data.success) {
                setSystemStatus(statusResponse.data.system);
                await adminDB.set('system_status_dashboard', statusResponse.data.system);
                markFetched('system_status_dashboard');
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch dashboard data", error);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const dashboardKey = `dashboard_${timeFilter}`;
            // If we have fetched this session, try to load from DB first
            if (hasFetched(dashboardKey)) {
                setLoading(true);
                const cachedStats = await adminDB.get(dashboardKey);
                const cachedStatus = await adminDB.get('system_status_dashboard');

                if (cachedStats && cachedStatus) {
                    setData(cachedStats);
                    setSystemStatus(cachedStatus);
                    setLoading(false);
                    return; // Skip API call
                }
            }

            // If not fetched in this session (or DB missing), fetch from API
            fetchFromApi(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, [timeFilter]);

    const handleRefresh = () => {
        fetchFromApi(true);
    };

    const FilterButton = ({ value, label }) => (
        <button
            onClick={() => setTimeFilter(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === value
                ? 'bg-[#2F3C7E] text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
        >
            {label}
        </button>
    );

    if (loading && !data) {
        return (
            <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-5 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse"></div>)}
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card p-6 bg-white rounded-2xl border border-slate-200">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 flex-1">
                                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                                </div>
                                <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="mt-4 h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="p-0">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {[1, 2, 3, 4, 5].map(i => <th key={i} className="p-5"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-slate-50">
                                        {[1, 2, 3, 4, 5].map(j => <td key={j} className="p-5"><div className="h-5 w-full bg-slate-50 rounded animate-pulse"></div></td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Welcome back, get an update on your platform.</p>
                </div>
                <div className="flex space-x-2">
                    <FilterButton value="today" label="Today" />
                    <FilterButton value="yesterday" label="Yesterday" />
                    <FilterButton value="7days" label="Last 7 Days" />
                    <FilterButton value="all" label="All Time" />
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 transition-colors"
                        title="Refresh Dashboard"
                    >
                        <RefreshCw size={18} className={loading && data ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Sellers</p>
                            <h3 className="text-3xl font-bold text-slate-800">{data?.stats?.totalSellers || 0}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
                        <TrendingUp size={14} className="mr-1" />
                        <span>+12% from last month</span>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Active Sellers</p>
                            <h3 className="text-3xl font-bold text-slate-800">{data?.stats?.activeSellers || 0}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
                        <span>Currently active on platform</span>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">New Registrations</p>
                            <h3 className="text-3xl font-bold text-slate-800">{data?.stats?.newRegistrations || 0}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
                        <span>{timeFilter === 'all' ? 'Total to date' : 'In selected period'}</span>
                    </div>
                </div>

                <div className="stat-card group bg-slate-900 border-none text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1">Backend Status</p>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">{systemStatus?.database?.status || 'Unknown'}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${systemStatus?.database?.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                <Database size={20} />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Host</span>
                                <span className="text-slate-200 font-mono">{systemStatus?.database?.host || '-'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Uptime</span>
                                <span className="text-slate-200 font-mono">{systemStatus?.server?.uptime ? Math.floor(systemStatus.server.uptime / 60) + 'm' : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Recent Registrations</h2>
                        <p className="text-xs text-slate-500 mt-1">New sellers joining the platform</p>
                    </div>
                    <button className="text-sm font-semibold text-[#2F3C7E] hover:text-[#1e2652]">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="p-5 pl-8">Seller Name</th>
                                <th className="p-5">Shop Info</th>
                                <th className="p-5">Contact</th>
                                <th className="p-5">Joined Date</th>
                                <th className="p-5">Stats</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.recentSellers?.map(seller => (
                                <tr key={seller._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-[#2F3C7E] flex items-center justify-center font-bold text-lg mr-4 border border-blue-200">
                                                {seller.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{seller.name}</p>
                                                <p className="text-xs text-slate-400">ID: {seller._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm font-medium text-slate-700">{seller.shopName || 'N/A'}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm text-slate-600">{seller.email}</p>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center text-sm text-slate-500">
                                            <Calendar size={14} className="mr-2 text-slate-400" />
                                            {new Date(seller.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                            New
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.recentSellers || data.recentSellers.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 bg-slate-50/30">
                                        No recent sellers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
