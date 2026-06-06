import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data);
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [user]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/approvals/${id}/status`, { status, remarks: `${status} by ${user.name}` });
      fetchApprovals();
    } catch (err) {
      console.error(`Failed to ${status} approval`, err);
      alert(err.response?.data?.message || `Failed to ${status}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Search approvals..." 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Document Type</th>
                <th className="p-4 font-semibold">Reference ID</th>
                <th className="p-4 font-semibold">Requested By</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : approvals.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending approvals found.</td></tr>
              ) : (
                approvals.map(approval => (
                  <tr key={approval._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{approval.documentType}</td>
                    <td className="p-4 text-gray-600 font-mono text-sm">{approval.documentId}</td>
                    <td className="p-4 text-gray-600">{approval.requestedBy?.name || 'Unknown'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${approval.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : approval.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {approval.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      {approval.status === 'Pending' && (
                        <>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors" onClick={() => handleAction(approval._id, 'Approved')}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 bg-white border border-red-200 rounded shadow-sm transition-colors" onClick={() => handleAction(approval._id, 'Rejected')}>
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

export default Approvals;
