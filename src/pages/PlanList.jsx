import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Check, X, Tag, Calendar, Database, Users, ShoppingBag, Package, RefreshCw } from 'lucide-react';
import { adminDB } from '../utils/db';
import { hasFetched, markFetched } from '../utils/sessionCache';

export default function PlanList() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const initialFormState = {
        name: '',
        description: '',
        price: '',
        durationDays: 30,
        planType: 'standard',
        maxCustomers: 0,
        maxProducts: 0,
        maxOrders: 0,
        unlockedModules: [],
        lockedModules: [],
        isActive: true
    };

    const availableModules = [
        'Customers',
        'Products',
        'Orders',
        'Billing',
        'Staff',
        'Analytics',
        'Inventory',
        'Reports'
    ];

    const [formData, setFormData] = useState(initialFormState);

    const fetchPlans = async (isManualRefresh = false, signal = null) => {
        try {
            if (isManualRefresh || !plans.length) setLoading(true);
            const { data } = await api.get('/admin/plans', { signal });
            if (data.success) {
                setPlans(data.plans);
                await adminDB.set('plans_list', data.plans);
                markFetched('plans_list');
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled') return;
            console.error("Failed to fetch plans", error);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            const key = 'plans_list';
            if (hasFetched(key)) {
                setLoading(true);
                const cachedPlans = await adminDB.get(key);

                if (cachedPlans) {
                    setPlans(cachedPlans);
                    setLoading(false);
                    return;
                }
            }
            fetchPlans(false, controller.signal);
        };
        loadData();
        return () => controller.abort();
    }, []);

    const handleRefresh = () => {
        fetchPlans(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await api.put(`/admin/plans/${editingPlan._id}`, formData);
            } else {
                await api.post('/admin/plans', formData);
            }
            setShowModal(false);
            setEditingPlan(null);
            setFormData(initialFormState);
            // Updating plans, so force fetch
            fetchPlans(true);
        } catch (error) {
            console.error("Error saving plan", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/admin/plans/${id}`);
                // Deleting plans, so force fetch
                fetchPlans(true);
            } catch (error) {
                console.error("Error deleting plan", error);
            }
        }
    };

    const openModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description,
                price: plan.price,
                durationDays: plan.durationDays,
                planType: plan.planType,
                maxCustomers: plan.maxCustomers || 0,
                maxProducts: plan.maxProducts || 0,
                maxOrders: plan.maxOrders || 0,
                unlockedModules: plan.unlockedModules || [],
                lockedModules: plan.lockedModules || [],
                isActive: plan.isActive
            });
        } else {
            setEditingPlan(null);
            setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const toggleModule = (module, type) => {
        if (type === 'unlocked') {
            const newUnlocked = formData.unlockedModules.includes(module)
                ? formData.unlockedModules.filter(m => m !== module)
                : [...formData.unlockedModules, module];
            // Remove from locked if adding to unlocked
            const newLocked = formData.lockedModules.filter(m => m !== module);
            setFormData({ ...formData, unlockedModules: newUnlocked, lockedModules: newLocked });
        } else {
            const newLocked = formData.lockedModules.includes(module)
                ? formData.lockedModules.filter(m => m !== module)
                : [...formData.lockedModules, module];
            // Remove from unlocked if adding to locked
            const newUnlocked = formData.unlockedModules.filter(m => m !== module);
            setFormData({ ...formData, lockedModules: newLocked, unlockedModules: newUnlocked });
        }
    };

    if (loading && !plans.length) {
        return (
            <div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-5 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                            <div className="h-2 w-full bg-slate-100 animate-pulse"></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div>
                                </div>
                                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                                <div className="space-y-2 mb-6">
                                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                                    <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                                </div>
                                <div className="h-10 w-40 bg-slate-200 rounded animate-pulse mb-6"></div>
                                <div className="space-y-4 mb-6">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="flex items-center">
                                            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse mr-3"></div>
                                            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Subscription Plans</h1>
                    <p className="text-slate-500 mt-1">Manage pricing levels and feature limits</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-2 bg-white text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={20} className={loading && plans.length ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Create New Plan</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan._id} className="relative group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                        <div className={`h - 2 w - full ${plan.planType === 'pro' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : plan.planType === 'mini' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'} `}></div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-500 border border-slate-100">
                                    {plan.planType}
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(plan)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(plan._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 flex-1">{plan.description}</p>

                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-bold text-slate-800">₹{plan.price}</span>
                                <span className="text-slate-400 ml-2">/ {plan.durationDays} days</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Users size={16} className="text-slate-400 mr-3" />
                                    <span>{plan.maxCustomers ? `${plan.maxCustomers} Customers` : 'Unlimited Customers'}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Package size={16} className="text-slate-400 mr-3" />
                                    <span>{plan.maxProducts ? `${plan.maxProducts} Products` : 'Unlimited Products'}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <ShoppingBag size={16} className="text-slate-400 mr-3" />
                                    <span>{plan.maxOrders ? `${plan.maxOrders} Orders` : 'Unlimited Orders'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                            <span className={`text - xs font - semibold ${plan.isActive ? 'text-emerald-600' : 'text-slate-400'} `}>
                                {plan.isActive ? '● Active' : '○ Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-slate-800">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Plan Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. Starter Pack"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        required
                                        rows="3"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field resize-none"
                                        placeholder="Plan description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.durationDays}
                                        onChange={e => setFormData({ ...formData, durationDays: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Plan Type</label>
                                    <select
                                        value={formData.planType}
                                        onChange={e => setFormData({ ...formData, planType: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="mini">Mini</option>
                                        <option value="standard">Standard</option>
                                        <option value="pro">Pro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-slate-700">Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Modules Section - Only for non-mini plans */}
                                {formData.planType !== 'mini' && (
                                    <div className="col-span-2 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Module Access</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-emerald-700 mb-3">Unlocked Modules</label>
                                                <div className="space-y-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                                    {availableModules.map(module => (
                                                        <label key={module} className="flex items-center cursor-pointer hover:bg-emerald-100 p-2 rounded-lg transition">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.unlockedModules.includes(module)}
                                                                onChange={() => toggleModule(module, 'unlocked')}
                                                                className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                                                            />
                                                            <span className="ml-3 text-sm text-slate-700">{module}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-red-700 mb-3">Locked Modules</label>
                                                <div className="space-y-2 bg-red-50 p-4 rounded-xl border border-red-100">
                                                    {availableModules.map(module => (
                                                        <label key={module} className="flex items-center cursor-pointer hover:bg-red-100 p-2 rounded-lg transition">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.lockedModules.includes(module)}
                                                                onChange={() => toggleModule(module, 'locked')}
                                                                className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                                                            />
                                                            <span className="ml-3 text-sm text-slate-700">{module}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3 italic">
                                            Note: Modules not selected in either list will have default access based on plan type.
                                        </p>
                                    </div>
                                )}

                                <div className="col-span-2 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Limits (0 = Unlimited)</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Max Customers</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.maxCustomers}
                                                onChange={e => setFormData({ ...formData, maxCustomers: e.target.value })}
                                                className="input-field text-sm"
                                                placeholder="0 for unlimited"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Max Products</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.maxProducts}
                                                onChange={e => setFormData({ ...formData, maxProducts: e.target.value })}
                                                className="input-field text-sm"
                                                placeholder="0 for unlimited"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Max Orders</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.maxOrders}
                                                onChange={e => setFormData({ ...formData, maxOrders: e.target.value })}
                                                className="input-field text-sm"
                                                placeholder="0 for unlimited"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
