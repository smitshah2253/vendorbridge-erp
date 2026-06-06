import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FileSignature, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  BarChart, 
  LogOut,
  History,
  Bell
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Notification Bell States
  const [activities, setActivities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activity?limit=5');
      setActivities(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch layout notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
      const interval = setInterval(fetchActivities, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager', 'Admin'] },
    { name: 'Vendors', path: '/vendors', icon: <Users size={20} />, roles: ['Procurement Officer', 'Admin'] },
    { name: 'RFQs', path: '/rfqs', icon: <FileText size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager', 'Admin'] },
    { name: 'Quotations', path: '/quotations', icon: <FileSignature size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Approvals', path: '/approvals', icon: <CheckSquare size={20} />, roles: ['Manager'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Invoices', path: '/invoices', icon: <Receipt size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Reports', path: '/reports', icon: <BarChart size={20} />, roles: ['Procurement Officer', 'Admin', 'Manager'] },
    { name: 'Activity Logs', path: '/activity-logs', icon: <History size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager', 'Admin'] },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden text-gray-900 font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight m-0">VendorBridge</h2>
          <span className="text-xxs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full self-start font-bold uppercase tracking-wider">{user?.role || 'Guest'}</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => (
            item.roles.includes(user?.role) && (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button 
            className="flex items-center gap-3.5 w-full px-4 py-3 text-slate-400 font-semibold rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-xs">
          <div>
            <h3 className="text-xl font-bold text-gray-800 m-0">{navItems.find(item => item.path === location.pathname)?.name || 'Welcome'}</h3>
          </div>
          <div className="flex items-center gap-6">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-all relative cursor-pointer outline-none border border-gray-100"
              >
                <Bell size={20} />
                {activities.length > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-sm">Recent Alerts</span>
                    <button 
                      onClick={() => { setShowDropdown(false); navigate('/activity-logs'); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {activities.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">No new alerts</div>
                    ) : (
                      activities.map(act => (
                        <div key={act._id} className="p-3.5 hover:bg-gray-50/50 transition-colors text-xs text-gray-700 flex flex-col gap-0.5">
                          <div className="font-semibold text-gray-900">{act.action} {act.entity}</div>
                          <div className="text-gray-500">{act.userId?.name || 'System'} completed action</div>
                          <div className="text-xxs text-gray-400 mt-1">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
 
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-600 text-sm">{user?.name || 'Guest User'}</span>
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-50">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
