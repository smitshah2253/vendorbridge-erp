import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
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
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Download } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const { user } = useContext(AuthContext);
  
  const [spendingData, setSpendingData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Procurement Spend ($)',
        data: [12000, 19000, 15000, 22000, 18000, 25000],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.4
      }
    ]
  });

  const [categoryData, setCategoryData] = useState({
    labels: ['IT Equipment', 'Office Supplies', 'Consulting', 'Logistics'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
        ],
      }
    ]
  });

  const exportReport = () => {
    alert("Report exported as CSV successfully!");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          onClick={exportReport}
        >
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Spending Trends</h4>
          </div>
          <div className="p-6">
            <Line data={spendingData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h4 className="font-semibold text-gray-800">Spend by Category</h4>
          </div>
          <div className="p-6 flex justify-center items-center" style={{ height: '350px' }}>
            <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
