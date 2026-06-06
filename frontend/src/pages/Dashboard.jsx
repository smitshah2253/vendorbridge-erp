import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { FileText, Users, ShoppingCart, CheckSquare, Plus, ArrowRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    approvals: 0,
    purchaseOrders: 0,
    quotations: 0,
    invoices: 0
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const promises = [];
        const keys = [];

        // Base endpoints every user can query
        promises.push(api.get('/rfqs'));
        keys.push('rfqs');
        promises.push(api.get('/purchase-orders'));
        keys.push('purchaseOrders');
        promises.push(api.get('/activity?limit=5'));
        keys.push('activities');

        if (user.role === 'Vendor') {
          promises.push(api.get('/quotations'));
          keys.push('quotations');
          promises.push(api.get('/invoices'));
          keys.push('invoices');
        } else {
          promises.push(api.get('/vendors'));
          keys.push('vendors');

          if (user.role === 'Manager' || user.role === 'Admin') {
            promises.push(api.get('/approvals'));
            keys.push('approvals');
          }
          if (user.role === 'Procurement Officer') {
            promises.push(api.get('/invoices'));
            keys.push('invoices');
          }
        }

        const results = await Promise.all(promises);
        
        const newStats = {
          vendors: 0,
          rfqs: 0,
          approvals: 0,
          purchaseOrders: 0,
          quotations: 0,
          invoices: 0
        };

        results.forEach((res, index) => {
          const key = keys[index];
          const dataList = res.data.data || res.data || [];
          if (key === 'activities') {
            setActivities(dataList);
          } else if (key === 'approvals') {
            newStats.approvals = dataList.filter(a => a.status === 'Pending').length;
          } else {
            newStats[key] = dataList.length;
          }
        });

        setStats(newStats);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchStats();
  }, [user]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
  };

  const getChartData = () => {
    if (user?.role === 'Vendor') {
      return {
        labels: ['Assigned RFQs', 'Quotations', 'Purchase Orders', 'Invoices'],
        datasets: [
          {
            label: 'Transactions Summary',
            data: [stats.rfqs, stats.quotations, stats.purchaseOrders, stats.invoices],
            backgroundColor: 'rgba(124, 58, 237, 0.85)',
            borderRadius: 6,
          }
        ]
      };
    } else if (user?.role === 'Procurement Officer') {
      return {
        labels: ['Vendors', 'RFQs', 'Purchase Orders', 'Invoices'],
        datasets: [
          {
            label: 'Procurement Statistics',
            data: [stats.vendors, stats.rfqs, stats.purchaseOrders, stats.invoices],
            backgroundColor: 'rgba(124, 58, 237, 0.85)',
            borderRadius: 6,
          }
        ]
      };
    } else {
      return {
        labels: ['Vendors', 'RFQs', 'Pending Approvals', 'Purchase Orders'],
        datasets: [
          {
            label: 'Operations Summary',
            data: [stats.vendors, stats.rfqs, stats.approvals, stats.purchaseOrders],
            backgroundColor: 'rgba(124, 58, 237, 0.85)',
            borderRadius: 6,
          }
        ]
      };
    }
  };

  const formatActivityText = (act) => {
    const userName = act.userId?.name || 'Someone';
    const action = act.action;
    const entity = act.entity;
    const details = act.details || {};
    
    let target = '';
    if (entity === 'RFQ') target = details.title || 'an RFQ';
    else if (entity === 'Vendor') target = details.name || 'a vendor';
    else if (entity === 'Quotation') target = `Quotation for "${details.rfqTitle || 'RFQ'}"`;
    else if (entity === 'Purchase Order') target = details.poNumber || 'a PO';
    else if (entity === 'Invoice') target = details.invoiceNumber || 'an invoice';
    
    return `${userName} ${action.toLowerCase()} ${entity.toLowerCase()} ${target}`;
  };

  const getCards = () => {
    if (user?.role === 'Vendor') {
      return [
        { label: 'Assigned RFQs', value: stats.rfqs, icon: <FileText size={22} />, bg: 'bg-violet-50 text-violet-600 border border-violet-100', path: '/rfqs' },
        { label: 'My Quotations', value: stats.quotations, icon: <CheckSquare size={22} />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', path: '/quotations' },
        { label: 'Purchase Orders', value: stats.purchaseOrders, icon: <ShoppingCart size={22} />, bg: 'bg-blue-50 text-blue-600 border border-blue-100', path: '/purchase-orders' },
        { label: 'My Invoices', value: stats.invoices, icon: <Plus size={22} />, bg: 'bg-amber-50 text-amber-600 border border-amber-100', path: '/invoices' }
      ];
    } else if (user?.role === 'Procurement Officer') {
      return [
        { label: 'Total Vendors', value: stats.vendors, icon: <Users size={22} />, bg: 'bg-violet-50 text-violet-600 border border-violet-100', path: '/vendors' },
        { label: 'Active RFQs', value: stats.rfqs, icon: <FileText size={22} />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', path: '/rfqs' },
        { label: 'Purchase Orders', value: stats.purchaseOrders, icon: <ShoppingCart size={22} />, bg: 'bg-blue-50 text-blue-600 border border-blue-100', path: '/purchase-orders' },
        { label: 'Invoices Logged', value: stats.invoices, icon: <Plus size={22} />, bg: 'bg-amber-50 text-amber-600 border border-amber-100', path: '/invoices' }
      ];
    } else { // Manager or Admin
      return [
        { label: 'Total Vendors', value: stats.vendors, icon: <Users size={22} />, bg: 'bg-violet-50 text-violet-600 border border-violet-100', path: '/vendors' },
        { label: 'Active RFQs', value: stats.rfqs, icon: <FileText size={22} />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', path: '/rfqs' },
        { label: 'Pending Approvals', value: stats.approvals, icon: <CheckSquare size={22} />, bg: 'bg-amber-50 text-amber-600 border border-amber-100', path: '/approvals' },
        { label: 'Purchase Orders', value: stats.purchaseOrders, icon: <ShoppingCart size={22} />, bg: 'bg-blue-50 text-blue-600 border border-blue-100', path: '/purchase-orders' }
      ];
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getCards().map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(card.path)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className={`p-4 rounded-xl transition-transform group-hover:scale-105 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{card.label}</h3>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h4 className="font-bold text-gray-800 mb-4 text-base">Quick Actions</h4>
        <div className="flex flex-wrap gap-4">
          {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
            <button 
              onClick={() => navigate('/rfqs')} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all text-sm flex items-center gap-2 cursor-pointer border border-transparent"
            >
              <Plus size={16} /> Create RFQ
            </button>
          )}
          {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
            <button 
              onClick={() => navigate('/vendors')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all text-sm flex items-center gap-2 cursor-pointer border border-transparent"
            >
              <Plus size={16} /> Register Vendor
            </button>
          )}
          <button 
            onClick={() => navigate('/rfqs')} 
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            View Active RFQs
          </button>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-800 text-base">Analytics Overview</h4>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center">
            <Bar options={chartOptions} data={getChartData()} />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 text-base">Recent Activity</h4>
            <button 
              onClick={() => navigate('/activity-logs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-6 flex-1">
            {activities.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 border border-dashed border-gray-200 rounded-2xl py-8">
                <p className="text-sm font-medium">No activity logs found.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((act, actIdx) => (
                    <li key={act._id}>
                      <div className="relative pb-8">
                        {actIdx !== activities.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-150" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-4 ring-indigo-50/50">
                              {act.userId?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-850 font-semibold">
                                {formatActivityText(act)}
                              </p>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-gray-400 font-medium">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
