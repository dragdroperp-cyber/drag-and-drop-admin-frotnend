import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Server, Database, Activity, HardDrive, Cpu, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import RequestTraffic from '../components/RequestTraffic';
import { adminDB } from '../utils/db'; // Import adminDB
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function SystemStatus() {
    const [systemData, setSystemData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSystemStatus = async (isManualRefresh = false, signal = null) => {
        try {
            if (isManualRefresh || !systemData) setLoading(true);
            const { data } = await api.get('/admin/system-status', { signal });
            if (data.success) {
                setSystemData(data.system);
                await adminDB.set('system_status', data.system);
                markFetched('system_status');
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch system status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const key = 'system_status';
            if (hasFetched(key)) {
                setLoading(true);
                const cachedData = await adminDB.get(key);
                if (cachedData) {
                    setSystemData(cachedData);
                    setLoading(false);
                    return;
                }
            }
            fetchSystemStatus(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, []);

    // Manual refresh handler
    const handleRefresh = () => {
        fetchSystemStatus(true);
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    };

    // Safe access
    const healthStatus = systemData?.health?.overall || 'unknown';
    const isHealthy = healthStatus === 'healthy';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">System Health</h1>
                    <p className="text-slate-500 mt-1">Monitor backend and database performance</p>
                </div>
                {loading && !systemData ? (
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
                        <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse ml-2"></div>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isHealthy ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="uppercase tracking-wider text-sm">{healthStatus}</span>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-200 shadow-sm ml-2"
                            title="Refresh System Status"
                        >
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                )}
            </div>

            {/* Health Checks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border ${loading && !systemData ? 'bg-slate-50 border-slate-200' : systemData?.health?.checks?.database ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Database Connection</span>
                        {loading && !systemData ? <div className="h-5 w-5 bg-slate-300 rounded-full animate-pulse"></div> :
                            systemData?.health?.checks?.database ?
                                <CheckCircle size={18} className="text-emerald-600" /> :
                                <AlertCircle size={18} className="text-red-600" />
                        }
                    </div>
                </div>
                <div className={`p-4 rounded-xl border ${loading && !systemData ? 'bg-slate-50 border-slate-200' : systemData?.health?.checks?.memory ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Memory Health</span>
                        {loading && !systemData ? <div className="h-5 w-5 bg-slate-300 rounded-full animate-pulse"></div> :
                            systemData?.health?.checks?.memory ?
                                <CheckCircle size={18} className="text-emerald-600" /> :
                                <AlertCircle size={18} className="text-red-600" />
                        }
                    </div>
                </div>
                <div className={`p-4 rounded-xl border ${loading && !systemData ? 'bg-slate-50 border-slate-200' : systemData?.health?.checks?.uptime ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Server Running</span>
                        {loading && !systemData ? <div className="h-5 w-5 bg-slate-300 rounded-full animate-pulse"></div> :
                            systemData?.health?.checks?.uptime ?
                                <CheckCircle size={18} className="text-emerald-600" /> :
                                <AlertCircle size={18} className="text-red-600" />
                        }
                    </div>
                </div>
            </div>


            {/* Request Traffic */}
            <RequestTraffic />

            {/* Server Metrics */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Server size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Backend Server</h2>
                        <p className="text-sm text-slate-500">Node.js runtime metrics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Clock size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Uptime</span>
                        </div>
                        {loading && !systemData ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-2xl font-bold text-slate-800">{systemData?.server?.uptimeFormatted || '0s'}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Activity size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                        </div>
                        {loading && !systemData ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-2xl font-bold text-emerald-600 uppercase">{systemData?.server?.status || 'Unknown'}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Server size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Node Version</span>
                        </div>
                        {loading && !systemData ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-2xl font-bold text-slate-800">{systemData?.server?.nodeVersion || 'N/A'}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Cpu size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Platform</span>
                        </div>
                        {loading && !systemData ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-2xl font-bold text-slate-800 uppercase">{systemData?.server?.platform || 'N/A'}</p>}
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <HardDrive size={16} className="text-purple-600" />
                        Memory Usage (MB)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">RSS</p>
                            {loading && !systemData ? <div className="h-6 w-16 bg-white/50 rounded animate-pulse"></div> :
                                <p className="text-lg font-bold text-slate-800">{systemData?.server?.memory?.rss || '0'}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Heap Total</p>
                            {loading && !systemData ? <div className="h-6 w-16 bg-white/50 rounded animate-pulse"></div> :
                                <p className="text-lg font-bold text-slate-800">{systemData?.server?.memory?.heapTotal || '0'}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Heap Used</p>
                            {loading && !systemData ? <div className="h-6 w-16 bg-white/50 rounded animate-pulse"></div> :
                                <p className="text-lg font-bold text-purple-600">{systemData?.server?.memory?.heapUsed || '0'}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">External</p>
                            {loading && !systemData ? <div className="h-6 w-16 bg-white/50 rounded animate-pulse"></div> :
                                <p className="text-lg font-bold text-slate-800">{systemData?.server?.memory?.external || '0'}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Array Buffers</p>
                            {loading && !systemData ? <div className="h-6 w-16 bg-white/50 rounded animate-pulse"></div> :
                                <p className="text-lg font-bold text-slate-800">{systemData?.server?.memory?.arrayBuffers || '0'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Metrics */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <Database size={24} className="text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">MongoDB Database</h2>
                        <p className="text-sm text-slate-500">Database statistics and storage</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Host</p>
                        {loading && !systemData ? <div className="h-7 w-48 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-lg font-bold text-slate-800 font-mono">{systemData?.database?.host || 'N/A'}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Database Name</p>
                        {loading && !systemData ? <div className="h-7 w-32 bg-slate-200 rounded animate-pulse"></div> :
                            <p className="text-lg font-bold text-slate-800 font-mono">{systemData?.database?.name || 'N/A'}</p>}
                    </div>
                </div>

                {(loading && !systemData) ? (
                    <div className="space-y-6 animate-pulse">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
                            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
                            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
                            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="h-20 bg-slate-50 rounded-lg"></div>
                            <div className="h-20 bg-slate-50 rounded-lg"></div>
                            <div className="h-20 bg-slate-50 rounded-lg"></div>
                        </div>
                    </div>
                ) : (systemData?.database?.stats && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-slate-500 mb-1">Data Size</p>
                                <p className="text-xl font-bold text-blue-600">{formatBytes(systemData.database.stats.dataSize)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                <p className="text-xs text-slate-500 mb-1">Storage Size</p>
                                <p className="text-xl font-bold text-emerald-600">{formatBytes(systemData.database.stats.storageSize)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                <p className="text-xs text-slate-500 mb-1">Index Size</p>
                                <p className="text-xl font-bold text-purple-600">{formatBytes(systemData.database.stats.indexSize)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                <p className="text-xs text-slate-500 mb-1">Total Objects</p>
                                <p className="text-xl font-bold text-orange-600">{systemData.database.stats.objects?.toLocaleString() || 0}</p>
                            </div>
                        </div>

                        {/* Collections */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3">Collections</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {systemData?.database?.collections?.map((col) => (
                                    <div key={col.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-semibold text-slate-800 text-sm mb-2">{col.name}</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-slate-500">Documents</p>
                                                <p className="font-bold text-slate-700">{col.count?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Size</p>
                                                <p className="font-bold text-slate-700">{formatBytes(col.size)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
}
