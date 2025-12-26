import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function SellerList() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSellers = async (isManualRefresh = false, signal = null) => {
        try {
            if (isManualRefresh || !sellers.length) setLoading(true);
            const { data } = await api.get('/admin/sellers', { signal });
            if (data.success) {
                setSellers(data.sellers);
                await adminDB.set('sellers_list', data.sellers);
                markFetched('sellers_list');
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch sellers", error);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const key = 'sellers_list';
            if (hasFetched(key)) {
                setLoading(true);
                const cachedSellers = await adminDB.get(key);

                if (cachedSellers) {
                    setSellers(cachedSellers);
                    setLoading(false);
                    return;
                }
            }
            fetchSellers(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, []);

    const handleRefresh = () => {
        fetchSellers(true);
    };

    const filteredSellers = sellers.filter(seller =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.shopName && seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && !sellers.length && !searchTerm) {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">All Sellers</h1>
                    <div className="h-10 w-72 bg-slate-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <tr key={i} className="border-b border-slate-100">
                                    {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="p-4"><div className="h-5 w-full bg-slate-50 rounded animate-pulse"></div></td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">All Sellers</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search sellers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 p-2 border border-slate-300 rounded-lg w-72 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Name</th>
                            <th className="p-4 font-semibold text-slate-600">Shop</th>
                            <th className="p-4 font-semibold text-slate-600">Email</th>
                            <th className="p-4 font-semibold text-slate-600">Status</th>
                            <th className="p-4 font-semibold text-slate-600">Joined</th>
                            <th className="p-4 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSellers.map(seller => (
                            <tr key={seller._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                <td className="p-4 font-medium text-slate-800">{seller.name}</td>
                                <td className="p-4 text-slate-600">{seller.shopName || '-'}</td>
                                <td className="p-4 text-slate-600">{seller.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${seller.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {seller.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-sm">{new Date(seller.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <Link to={`/sellers/${seller._id}`} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-medium">
                                        <Eye size={16} />
                                        <span>View</span>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredSellers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-500">No sellers found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
