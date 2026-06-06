import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, FileText, Download } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const PurchaseOrders = () => {
  const { user } = useContext(AuthContext);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setPos(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch purchase orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [user]);

  const generateInvoice = async (poId) => {
    try {
      await api.post('/invoices', { poId });
      alert('Invoice generated successfully!');
      // Navigate to invoices or refresh PO list if needed
    } catch (err) {
      console.error("Failed to generate invoice", err);
      alert(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Search POs..." 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">PO Number</th>
                <th className="p-4 font-semibold">RFQ Title</th>
                <th className="p-4 font-semibold">Vendor</th>
                <th className="p-4 font-semibold">Total Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : pos.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No purchase orders found.</td></tr>
              ) : (
                pos.map(po => (
                  <tr key={po._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 font-mono text-sm">{po.poNumber}</td>
                    <td className="p-4 text-gray-600">{po.quotationId?.rfqId?.title || 'Unknown'}</td>
                    <td className="p-4 text-gray-600">{po.vendor?.name || 'Unknown'}</td>
                    <td className="p-4 font-semibold text-gray-800">${po.totalAmount?.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${po.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded shadow-sm transition-colors">
                        <FileText size={16} /> View
                      </button>
                      {user?.role === 'Procurement Officer' && (
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors" onClick={() => generateInvoice(po._id)}>
                          <Download size={14} /> Generate Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
