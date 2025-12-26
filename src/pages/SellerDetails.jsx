import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, User, Phone, MapPin, Calendar, Building, CreditCard, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function SellerDetails() {
    const { id } = useParams();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSeller = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh || !seller) setLoading(true);
            const { data } = await api.get(`/admin/sellers/${id}`);
            if (data.success) {
                setSeller(data.seller);
                await adminDB.set(`seller_${id}`, data.seller);
                markFetched(`seller_${id}`);
            }
        } catch (error) {
            console.error("Failed to fetch seller details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const key = `seller_${id}`;
            if (hasFetched(key)) {
                setLoading(true);
                const cachedSeller = await adminDB.get(key);
                if (cachedSeller) {
                    setSeller(cachedSeller);
                    setLoading(false);
                    return;
                }
            }
            fetchSeller();
        };
        loadData();
    }, [id]);

    const handleRefresh = () => {
        fetchSeller(true);
    };

    if (loading && !seller) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-white border border-slate-200 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
                                <div className="h-5 w-32 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse"></div>
                            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-6">
                            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-start">
                                    <div className="w-5 h-5 bg-slate-200 rounded animate-pulse mr-4 mt-0.5"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4"></div>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-start">
                                    <div className="w-5 h-5 bg-slate-200 rounded animate-pulse mr-4 mt-0.5"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (!seller && !loading) return <div className="p-8 text-center text-red-500">Seller not found</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Link to="/sellers" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft size={20} className="mr-1" />
                    Back to Sellers
                </Link>
                <button
                    onClick={handleRefresh}
                    className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 transition-colors"
                    title="Refresh Details"
                >
                    <RefreshCw size={20} className={loading && seller ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 text-3xl font-bold shadow-sm overflow-hidden">
                            {seller.profilePicture ?
                                <img src={seller.profilePicture} alt={seller.name} className="w-full h-full object-cover" /> :
                                seller.name.charAt(0).toUpperCase()
                            }
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{seller.name}</h1>
                            <p className="text-slate-500 flex items-center mt-1">
                                {seller.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${seller.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {seller.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">ID: {seller._id}</span>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">Business Details</h3>

                        <div className="flex items-start group">
                            <Building className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Shop Name</p>
                                <p className="font-medium text-slate-800 text-lg">{seller.shopName || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <Building className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Business Type</p>
                                <p className="font-medium text-slate-800">{seller.businessType || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <MapPin className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Address</p>
                                <p className="font-medium text-slate-800">{seller.shopAddress || 'N/A'}</p>
                                {(seller.city || seller.state || seller.pincode) &&
                                    <p className="text-slate-600 mt-1">{seller.city}, {seller.state} - {seller.pincode}</p>
                                }
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <CreditCard className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">GST Number</p>
                                <p className="font-medium text-slate-800 font-mono">{seller.gstNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">Contact & Subscription</h3>

                        <div className="flex items-start group">
                            <CreditCard className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Current Plan</p>
                                <p className="font-medium text-slate-800">
                                    {seller.currentPlanId?.planId?.name || 'Free Plan'}
                                    <span className="text-slate-500 text-sm ml-2 font-normal">
                                        ({seller.currentPlanId?.price ? `₹${seller.currentPlanId.price}` : 'Free'})
                                    </span>
                                </p>
                                {seller.currentPlanId?.expiryDate && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Expires: {new Date(seller.currentPlanId.expiryDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <Phone className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                                <p className="font-medium text-slate-800 font-mono">{seller.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <Calendar className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Joined Date</p>
                                <p className="font-medium text-slate-800">{new Date(seller.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>

                        <div className="flex items-start group">
                            <User className="w-5 h-5 text-slate-400 mr-4 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Last Activity</p>
                                <p className="font-medium text-slate-800">{seller.lastActivityDate ? new Date(seller.lastActivityDate).toLocaleString() : 'Never'}</p>
                                <p className="text-xs text-slate-400 mt-1">Profile Completed: {seller.profileCompleted ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
