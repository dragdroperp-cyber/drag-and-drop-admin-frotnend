import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Activity, Clock, AlertTriangle, BarChart2, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function RequestTraffic() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('24h');

    const fetchStats = async (isManualRefresh = false, signal = null) => {
        try {
            if (isManualRefresh || !stats) setLoading(true);
            const { data } = await api.get(`/admin/requests?timeRange=${timeRange}`, { signal });
            if (data.success) {
                setStats(data);
                await adminDB.set(`request_stats_${timeRange}`, data);
                markFetched(`request_stats_${timeRange}`);
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch request stats", error);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const key = `request_stats_${timeRange}`;
            if (hasFetched(key)) {
                setLoading(true);
                const cachedData = await adminDB.get(key);
                if (cachedData) {
                    setStats(cachedData);
                    setLoading(false);
                    return;
                }
            }
            fetchStats(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, [timeRange]);

    const handleRefresh = () => {
        fetchStats(true);
    };

    // Safe calculations for display or skeletons
    const maxCount = stats?.data?.reduce((max, item) => Math.max(max, item.count), 0) || 1;
    const totalDuration = stats?.data?.reduce((acc, curr) => acc + (curr.avgDuration * curr.count), 0) || 0;
    const totalCount = stats?.summary?.totalRequests || 1;
    const avgLatency = Math.round(totalDuration / totalCount);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <BarChart2 size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Traffic Analysis</h2>
                        <p className="text-sm text-slate-500">API request volume and performance</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-indigo-500"
                    >
                        <option value="1h">Last 1 Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Activity size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
                    </div>
                    {loading && !stats ? (
                        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-800">
                            {stats?.summary?.totalRequests?.toLocaleString() || 0}
                        </p>
                    )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <AlertTriangle size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Error Rate</span>
                    </div>
                    {loading && !stats ? (
                        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
                    ) : (
                        <p className={`text - 2xl font - bold ${Number(stats?.summary?.errorRate) > 1 ? 'text-red-600' : 'text-emerald-600'} `}>
                            {stats?.summary?.errorRate || 0}%
                        </p>
                    )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Clock size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
                    </div>
                    {loading && !stats ? (
                        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-800">
                            {avgLatency} ms
                        </p>
                    )}
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative pt-10">
                {loading && !stats ? (
                    <div className="h-64 w-full bg-slate-50 rounded-lg animate-pulse flex items-end p-4 gap-2">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="bg-slate-200 rounded-t w-full" style={{ height: `${Math.random() * 50 + 20}% ` }}></div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="h-64 flex items-end gap-1 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                            {stats?.data?.map((item, index) => {
                                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 min-w-[10px] sm:min-w-[20px] flex flex-col items-center group relative h-full justify-end">
                                        <div
                                            className={`w - full rounded - t - sm transition - all duration - 500 relative ${item.errors > 0 ? 'bg-red-300' : item.count > 0 ? 'bg-indigo-300 group-hover:bg-indigo-400' : 'bg-slate-100 group-hover:bg-slate-200'
                                                } `}
                                            style={{ height: `${Math.max(heightPercent, 2)}% ` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max pointer-events-none">
                                                <div className="bg-slate-800 text-white text-xs rounded py-2 px-3 shadow-lg flex flex-col gap-1">
                                                    <p className="font-semibold border-b border-slate-600 pb-1 mb-1">{new Date(item.timestamp).toLocaleString()}</p>
                                                    <p>Requests: <span className="font-mono">{item.count}</span></p>
                                                    <p>Errors: <span className={`font - mono ${item.errors > 0 ? 'text-red-300' : ''} `}>{item.errors}</span></p>
                                                    <p>Avg Time: <span className="font-mono">{item.avgDuration}ms</span></p>
                                                </div>
                                                {/* Arrow */}
                                                <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-400 px-1">
                            {stats?.data?.filter((_, i, arr) => {
                                // Show roughly 6 labels
                                const step = Math.ceil(arr.length / 6);
                                return i % step === 0;
                            }).map((item, i) => (
                                <span key={i}>{item.label}</span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
