import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Quotations = () => {
  const { user } = useContext(AuthContext);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data);
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [user]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/quotations/${id}/status`, { status: 'Approved' });
      fetchQuotations();
    } catch (err) {
      console.error("Failed to approve quotation", err);
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/quotations/${id}/status`, { status: 'Rejected' });
      fetchQuotations();
    } catch (err) {
      console.error("Failed to reject quotation", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
        {user?.role === 'Procurement Officer' && (
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
            Compare Selected
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Search quotations..." 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                {user?.role === 'Procurement Officer' && <th className="p-4 font-semibold w-12"></th>}
                <th className="p-4 font-semibold">RFQ Title</th>
                <th className="p-4 font-semibold">Vendor</th>
                <th className="p-4 font-semibold">Total Price</th>
                <th className="p-4 font-semibold">Delivery Time</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : quotations.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No quotations found.</td></tr>
              ) : (
                quotations.map(quote => (
                  <tr key={quote._id} className="hover:bg-gray-50 transition-colors">
                    {user?.role === 'Procurement Officer' && (
                      <td className="p-4"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300" /></td>
                    )}
                    <td className="p-4 font-medium text-gray-900">{quote.rfq?.title || 'Unknown RFQ'}</td>
                    <td className="p-4 text-gray-600">{quote.vendor?.name || 'Unknown Vendor'}</td>
                    <td className="p-4 font-semibold text-gray-800">${quote.totalPrice?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-gray-600">{quote.deliveryTimeline} days</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${quote.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : quote.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded shadow-sm transition-colors">
                        <Eye size={16} /> View
                      </button>
                      {user?.role === 'Manager' && quote.status === 'Pending' && (
                        <>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors" onClick={() => handleApprove(quote._id)}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 bg-white border border-red-200 rounded shadow-sm transition-colors" onClick={() => handleReject(quote._id)}>
                            <XCircle size={14} /> Reject
                          </button>
                        </>
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

export default Quotations;
