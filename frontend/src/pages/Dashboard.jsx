import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { FileText, Users, ShoppingCart, CheckSquare } from 'lucide-react';
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
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    approvals: 0,
    purchaseOrders: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vendorsRes, rfqsRes, posRes] = await Promise.all([
          api.get('/vendors'),
          api.get('/rfqs'),
          api.get('/purchase-orders')
        ]);
        setStats({
          vendors: vendorsRes.data.length,
          rfqs: rfqsRes.data.length,
          approvals: 0, // Mock for now
          purchaseOrders: posRes.data.length
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
  };

  const chartData = {
    labels: ['Vendors', 'RFQs', 'Pending Approvals', 'Purchase Orders'],
    datasets: [
      {
        label: 'Count',
        data: [stats.vendors, stats.rfqs, stats.approvals, stats.purchaseOrders],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Vendors</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.vendors}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Active RFQs</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.rfqs}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <CheckSquare size={28} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.approvals}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Purchase Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.purchaseOrders}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Analytics Overview</h4>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Recent Activity</h4>
          </div>
          <div className="p-6 flex-1">
            <div className="flex items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p>Activity logs will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
