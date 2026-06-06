import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [remarks, setRemarks] = useState({});

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals');
      setApprovals(res.data.data || res.data);
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
      const actionRemarks = remarks[id] || `${status} by Manager ${user.name}`;
      if (status === 'Approved') {
        await api.post(`/approvals/${id}/approve`, { remarks: actionRemarks });
      } else {
        await api.post(`/approvals/${id}/reject`, { remarks: actionRemarks });
      }
      alert(`Approval marked as ${status}`);
      // Clear remarks entry
      setRemarks(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchApprovals();
    } catch (err) {
      console.error(`Failed to ${status} approval`, err);
      alert(err.response?.data?.message || `Failed to ${status}`);
    }
  };

  const handleRemarksChange = (id, value) => {
    setRemarks(prev => ({ ...prev, [id]: value }));
  };

  const pendingApprovals = approvals.filter(app => 
    app.status === 'Pending' && 
    (app.rfqId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     app.quotationId?.vendorId?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const historyApprovals = approvals.filter(app => 
    app.status !== 'Pending'
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pending Approvals Queue</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="relative w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all bg-white" 
                placeholder="Search pending approvals..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-semibold">RFQ / Quotation Details</th>
                  <th className="p-4 font-semibold">Vendor</th>
                  <th className="p-4 font-semibold">Total Amount</th>
                  <th className="p-4 font-semibold">Approver Assignment</th>
                  <th className="p-4 font-semibold">Remarks / Notes</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && approvals.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : pendingApprovals.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No pending approvals found in queue.</td></tr>
                ) : (
                  pendingApprovals.map(approval => (
                    <tr key={approval._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">Quotation</div>
                        <div className="text-xs text-gray-500">RFQ: {approval.rfqId?.title || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">{approval.quotationId?.vendorId?.name || 'Unknown Vendor'}</td>
                      <td className="p-4 text-gray-900 font-bold">${approval.quotationId?.totalAmount?.toFixed(2) || '0.00'}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        <div className="font-medium">{approval.approverId?.name || 'Unassigned'}</div>
                        <div className="text-xs text-gray-400">{approval.approverId?.email}</div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          placeholder="Add approval/rejection remarks..." 
                          className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white outline-none" 
                          value={remarks[approval._id] || ''} 
                          onChange={(e) => handleRemarksChange(approval._id, e.target.value)} 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer" onClick={() => handleAction(approval._id, 'Approved')}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 bg-white border border-red-200 rounded-lg shadow-sm transition-colors cursor-pointer" onClick={() => handleAction(approval._id, 'Rejected')}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approvals History Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Approvals History & Timeline</h3>
        
        {historyApprovals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            <Clock className="mx-auto text-gray-300 mb-2" size={32} />
            <p>No historical approval actions logged yet.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 pl-6 space-y-8">
            {historyApprovals.map(approval => {
              const isApproved = approval.status === 'Approved';
              
              return (
                <div key={approval._id} className="relative group">
                  {/* Timeline indicator circle */}
                  <span className={`absolute -left-10 top-0.5 rounded-full ring-8 ring-white flex items-center justify-center p-1.5 ${
                    isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {isApproved ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </span>

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">Quotation Approved/Rejected</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isApproved ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {approval.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        RFQ Reference: <strong>{approval.rfqId?.title || 'Unknown RFQ'}</strong>
                      </div>
                      <div className="text-sm text-gray-600">
                        Vendor: <strong>{approval.quotationId?.vendorId?.name || 'Unknown Vendor'}</strong> | Total Amount: <strong>${approval.quotationId?.totalAmount?.toFixed(2) || '0.00'}</strong>
                      </div>
                      
                      {approval.remarks && (
                        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-w-2xl mt-2 border border-gray-100">
                          <MessageSquare size={14} className="shrink-0 text-gray-400 mt-0.5" />
                          <span><strong>Remarks:</strong> {approval.remarks}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 md:text-right shrink-0">
                      <div className="flex items-center md:justify-end gap-1.5">
                        <User size={13} />
                        <span>By: {approval.approverId?.name || 'Unknown Approver'}</span>
                      </div>
                      <div className="flex items-center md:justify-end gap-1.5">
                        <Calendar size={13} />
                        <span>{new Date(approval.approvedAt || approval.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
