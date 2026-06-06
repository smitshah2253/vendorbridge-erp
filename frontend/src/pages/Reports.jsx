import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Download, BarChart2, TrendingUp, DollarSign } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/invoices');
      const invoices = res.data.data || res.data;
      if (!Array.isArray(invoices) || invoices.length === 0) {
        alert("No invoices found to export.");
        return;
      }
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Invoice Number,PO Number,Vendor,Category,Subtotal,Tax,Total Amount,Status,Due Date,Date\n";
      
      invoices.forEach(inv => {
        const row = [
          inv.invoiceNumber || 'N/A',
          inv.poId?.poNumber || 'N/A',
          inv.vendorId?.name || 'N/A',
          inv.vendorId?.category || 'N/A',
          inv.subtotal || 0,
          inv.tax || 0,
          inv.totalAmount || 0,
          inv.status || 'N/A',
          inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
          new Date(inv.createdAt).toLocaleDateString()
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `vendorbridge_procurement_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export report", err);
      alert("Failed to export report CSV");
    }
  };

  // Helper defaults if DB is empty
  const defaultSpendTrends = [
    { _id: 'Jan', total: 0 },
    { _id: 'Feb', total: 0 },
    { _id: 'Mar', total: 0 }
  ];

  const defaultCategorySpend = [
    { _id: 'IT Equipment', total: 100 },
    { _id: 'Office Supplies', total: 100 }
  ];

  const trends = analytics?.spendingTrends?.length > 0 ? analytics.spendingTrends : defaultSpendTrends;
  const categories = analytics?.spendByCategory?.length > 0 ? analytics.spendByCategory : defaultCategorySpend;

  const spendingChartData = {
    labels: trends.map(item => item._id),
    datasets: [
      {
        label: 'Monthly Spend ($)',
        data: trends.map(item => item.total),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.4)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryChartData = {
    labels: categories.map(item => item._id),
    datasets: [
      {
        data: categories.map(item => item.total),
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#EC4899',
          '#3B82F6'
        ],
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Real-time dynamic spending stats backed by system transactions</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-semibold cursor-pointer"
          onClick={handleExportCSV}
        >
          <Download size={18} /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Cumulative Spend</h4>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              ${analytics?.totalSpending?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Invoices Logged</h4>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {analytics?.totalInvoices || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-lg">
            <BarChart2 size={24} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Approvals Queue</h4>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {analytics?.pendingApprovals || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Monthly Spending Trends</h4>
          </div>
          <div className="p-6 flex-1 flex items-center">
            {loading ? (
              <div className="text-center py-12 w-full text-gray-500">Loading trends...</div>
            ) : (
              <Line data={spendingChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Spend by Vendor Category</h4>
          </div>
          <div className="p-6 flex justify-center items-center flex-1" style={{ height: '350px' }}>
            {loading ? (
              <div className="text-center py-12 w-full text-gray-500">Loading categories...</div>
            ) : (
              <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
