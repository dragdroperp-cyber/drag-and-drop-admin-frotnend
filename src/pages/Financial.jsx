import { useEffect, useState } from 'react';
import api from '../api/axios';
import { IndianRupee, TrendingUp, CreditCard, PieChart, Calendar, Package, Users, BarChart3, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function Financial() {
    const [financialData, setFinancialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all');

    const fetchFinancialData = async (isManualRefresh = false, signal = null) => {
        try {
            if (isManualRefresh || !financialData) setLoading(true);
            const { data } = await api.get(`/admin/financial?timeFilter=${timeFilter}`, { signal });
            if (data.success) {
                setFinancialData(data.financial);
                await adminDB.set(`financial_${timeFilter}`, data.financial);
                markFetched(`financial_${timeFilter}`);
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch financial data", error);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const key = `financial_${timeFilter}`;
            if (hasFetched(key)) {
                setLoading(true);
                const cachedData = await adminDB.get(key);
                if (cachedData) {
                    setFinancialData(cachedData);
                    setLoading(false);
                    return;
                }
            }
            fetchFinancialData(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, [timeFilter]);

    const handleRefresh = () => {
        fetchFinancialData(true);
    };

    const FilterButton = ({ value, label }) => (
        <button
            onClick={() => setTimeFilter(value)}
            className={`px - 4 py - 2 rounded - lg text - sm font - medium transition - all ${timeFilter === value
                ? 'bg-[#2F3C7E] text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                } `}
        >
            {label}
        </button>
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const getMonthName = (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    if (loading && !financialData) {
        // Render Skeleton UI
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-5 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-9 w-20 bg-slate-200 rounded-lg animate-pulse"></div>)}
                    </div>
                </div>

                {/* Metrics Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="min-h-[160px] bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-3 flex-1">
                                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
                                </div>
                                <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mt-4"></div>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart Skeleton */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                        <div>
                            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>

                {/* Bottom Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                                <div>
                                    <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Financial Analytics</h1>
                    <p className="text-slate-500 mt-1">Revenue insights and subscription metrics</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterButton value="today" label="Today" />
                    <FilterButton value="yesterday" label="Yesterday" />
                    <FilterButton value="7days" label="Last 7 Days" />
                    <FilterButton value="30days" label="Last 30 Days" />
                    <FilterButton value="all" label="All Time" />
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading && financialData ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card group min-h-[160px] bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                                <p className="text-sm font-medium text-emerald-700 mb-2">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-emerald-900 break-words leading-tight">{formatCurrency(financialData?.totalRevenue)}</h3>
                            </div>
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                                <IndianRupee size={24} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-emerald-600 mt-4">
                            <TrendingUp size={14} className="mr-1 flex-shrink-0" />
                            <span>{timeFilter === 'all' ? 'Lifetime earnings' : 'In selected period'}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card group min-h-[160px]">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-2">Active Subscriptions</p>
                                <h3 className="text-3xl font-bold text-slate-800">{financialData?.activeSubscriptions || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users size={24} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-slate-400 mt-4">
                            <span>Currently paying users</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card group min-h-[160px]">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-2">Avg Revenue/User</p>
                                <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(financialData?.avgRevenuePerUser)}</h3>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <BarChart3 size={24} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-slate-400 mt-4">
                            <span>Per active subscription</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card group min-h-[160px]">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-2">Plan Types</p>
                                <h3 className="text-3xl font-bold text-slate-800">{financialData?.revenueByPlan?.length || 0}</h3>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Package size={24} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-slate-400 mt-4">
                            <span>Generating revenue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue by Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <PieChart size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Revenue by Plan</h2>
                        <p className="text-sm text-slate-500">Breakdown of earnings per subscription tier</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {financialData?.revenueByPlan?.map((plan, index) => {
                        const colorClasses = [
                            { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' },
                            { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' },
                            { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50' },
                            { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
                            { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50' }
                        ];
                        const colorClass = colorClasses[index % colorClasses.length];
                        const percentage = financialData.totalRevenue > 0
                            ? ((plan.revenue / financialData.totalRevenue) * 100).toFixed(1)
                            : 0;

                        return (
                            <div key={plan.planId} className={`p - 4 ${colorClass.light} rounded - xl hover: shadow - md transition - all border border - slate - 100`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w - 3 h - 3 rounded - full ${colorClass.bg} `}></div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{plan.planName}</p>
                                            <p className="text-xs text-slate-500">{plan.count} subscription{plan.count !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-800">{formatCurrency(plan.revenue)}</p>
                                        <p className="text-xs text-slate-500">{percentage}% of total</p>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className={`${colorClass.bg} h - 2.5 rounded - full transition - all duration - 500`}
                                        style={{ width: `${percentage}% ` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}

                    {(!financialData?.revenueByPlan || financialData.revenueByPlan.length === 0) && (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                            No revenue data available for the selected period
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <CreditCard size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Payment Status</h2>
                            <p className="text-sm text-slate-500">Transaction breakdown</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {financialData?.paymentStatusBreakdown?.map((status) => {
                            const statusStyles = {
                                completed: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Completed' },
                                pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Pending' },
                                failed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Failed' }
                            };
                            const style = statusStyles[status._id] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', label: status._id };

                            return (
                                <div key={status._id} className={`p - 4 ${style.bg} border ${style.border} rounded - xl`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text - sm font - semibold ${style.text} uppercase tracking - wider`}>
                                                {style.label}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{status.count} transaction{status.count !== 1 ? 's' : ''}</p>
                                        </div>
                                        <p className={`text - xl font - bold ${style.text} `}>
                                            {formatCurrency(status.amount)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {(!financialData?.paymentStatusBreakdown || financialData.paymentStatusBreakdown.length === 0) && (
                            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                                No payment data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Revenue Trend */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Calendar size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Monthly Trend</h2>
                            <p className="text-sm text-slate-500">Last 6 months revenue</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {financialData?.monthlyRevenue?.map((month) => {
                            const maxRevenue = Math.max(...(financialData.monthlyRevenue.map(m => m.revenue) || [1]));
                            const barWidth = (month.revenue / maxRevenue) * 100;

                            return (
                                <div key={`${month._id.year} -${month._id.month} `} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-700">
                                            {getMonthName(month._id.month)} {month._id.year}
                                        </span>
                                        <span className="font-bold text-slate-800">{formatCurrency(month.revenue)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${barWidth}% ` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-400">{month.count} sale{month.count !== 1 ? 's' : ''}</p>
                                </div>
                            );
                        })}

                        {(!financialData?.monthlyRevenue || financialData.monthlyRevenue.length === 0) && (
                            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                                No monthly data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
