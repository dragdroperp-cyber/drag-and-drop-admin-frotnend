import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Package, Database, IndianRupee, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/sellers', label: 'Sellers', icon: Users },
        { path: '/plans', label: 'Subscription Plans', icon: Package },
        { path: '/financial', label: 'Financial Analytics', icon: IndianRupee },
        { path: '/system', label: 'System Health', icon: Database },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Glass Effect */}
            <aside className={`w-72 sidebar-glass flex flex-col fixed h-full z-30 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-[rgba(15,23,42,0.06)] flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2F3C7E] to-[#F4A259]">
                            Drag and Drop
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-1">Super Admin Panel</p>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600 p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)} // Close on mobile navigation
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-[#2F3C7E] text-white shadow-lg shadow-[#2F3C7E]/25 translate-x-1'
                                    : 'text-slate-600 hover:bg-white hover:shadow-md hover:text-[#2F3C7E]'
                                    }`}
                            >
                                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#2F3C7E]'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-[rgba(15,23,42,0.06)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-500 hover:text-red-600 transition w-full px-4 py-3 rounded-xl hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden" id="main-content">
                {/* Mobile Header with Hamburger */}
                <div className="md:hidden p-4 pb-2 flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-3 font-semibold text-slate-700">Menu</span>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
