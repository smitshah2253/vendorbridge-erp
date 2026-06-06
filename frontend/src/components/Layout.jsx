import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FileSignature, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  BarChart, 
  LogOut 
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager', 'Admin'] },
    { name: 'Vendors', path: '/vendors', icon: <Users size={20} />, roles: ['Procurement Officer', 'Admin'] },
    { name: 'RFQs', path: '/rfqs', icon: <FileText size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager', 'Admin'] },
    { name: 'Quotations', path: '/quotations', icon: <FileSignature size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Approvals', path: '/approvals', icon: <CheckSquare size={20} />, roles: ['Manager'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Invoices', path: '/invoices', icon: <Receipt size={20} />, roles: ['Procurement Officer', 'Vendor', 'Manager'] },
    { name: 'Reports', path: '/reports', icon: <BarChart size={20} />, roles: ['Procurement Officer', 'Admin', 'Manager'] },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all">
        <div className="p-6 border-b border-gray-200 flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-indigo-600 tracking-tight m-0">VendorBridge</h2>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded self-start font-medium">{user?.role || 'Guest'}</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => (
            item.roles.includes(user?.role) && (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === item.path ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          ))}
        </nav>
        <div className="p-6 border-t border-gray-200">
          <button 
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h3 className="text-xl font-semibold m-0">{navItems.find(item => item.path === location.pathname)?.name || 'Welcome'}</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-600">{user?.name || 'Guest User'}</span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
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
