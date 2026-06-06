import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, Eye, CheckCircle, XCircle, Star, Scale, Check, Calendar, DollarSign, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Quotations = () => {
  const { user } = useContext(AuthContext);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Checkboxes & Compare States
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonList, setComparisonList] = useState([]);

  // View details state
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations');
      setQuotations(res.data.data || res.data);
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
      alert('Quotation approved successfully!');
      fetchQuotations();
      if (selectedQuote?._id === id) {
        setShowViewModal(false);
      }
    } catch (err) {
      console.error("Failed to approve quotation", err);
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/quotations/${id}/status`, { status: 'Rejected' });
      alert('Quotation rejected.');
      fetchQuotations();
      if (selectedQuote?._id === id) {
        setShowViewModal(false);
      }
    } catch (err) {
      console.error("Failed to reject quotation", err);
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleCreatePO = async (quotationId) => {
    try {
      await api.post('/purchase-orders', { quotationId });
      alert('Purchase Order generated successfully!');
      fetchQuotations();
    } catch (err) {
      console.error("Failed to generate Purchase Order", err);
      alert(err.response?.data?.message || 'Failed to generate PO');
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedQuoteIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleCompareSelected = () => {
    if (selectedQuoteIds.length < 2) {
      alert("Please select at least 2 quotations to compare.");
      return;
    }

    const selectedQuotes = quotations.filter(q => selectedQuoteIds.includes(q._id));
    
    // Verify they belong to the same RFQ
    const firstRfqId = selectedQuotes[0]?.rfqId?._id || selectedQuotes[0]?.rfqId;
    const sameRfq = selectedQuotes.every(q => {
      const qRfqId = q.rfqId?._id || q.rfqId;
      return String(qRfqId) === String(firstRfqId);
    });

    if (!sameRfq) {
      alert("Validation Error: Please select quotations belonging to the same RFQ to make a valid comparison.");
      return;
    }

    setComparisonList(selectedQuotes);
    setShowCompareModal(true);
  };

  const handleViewQuote = (quote) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  const getLowestCostQuote = () => {
    if (comparisonList.length === 0) return null;
    return comparisonList.reduce((prev, curr) => 
      (prev.totalAmount < curr.totalAmount) ? prev : curr
    );
  };

  const getFastestDeliveryQuote = () => {
    if (comparisonList.length === 0) return null;
    return comparisonList.reduce((prev, curr) => {
      const prevTime = Math.max(...(prev.items?.map(i => parseInt(i.deliveryTimeline) || 999) || [999]));
      const currTime = Math.max(...(curr.items?.map(i => parseInt(i.deliveryTimeline) || 999) || [999]));
      return (prevTime < currTime) ? prev : curr;
    });
  };

  const filteredQuotes = quotations.filter(q => {
    const rfqTitle = q.rfqId?.title || '';
    const vendorName = q.vendorId?.name || '';
    const term = searchQuery.toLowerCase();
    return rfqTitle.toLowerCase().includes(term) || vendorName.toLowerCase().includes(term);
  });

  const lowestCostQuote = getLowestCostQuote();
  const fastestDeliveryQuote = getFastestDeliveryQuote();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
        {user?.role === 'Procurement Officer' && (
          <button 
            className={`px-4 py-2 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-sm border cursor-pointer ${
              selectedQuoteIds.length >= 2 
                ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleCompareSelected}
            disabled={selectedQuoteIds.length < 2}
          >
            <Scale size={18} /> Compare Selected ({selectedQuoteIds.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all bg-white" 
              placeholder="Search quotations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                {user?.role === 'Procurement Officer' && <th className="p-4 font-semibold w-12 text-center"></th>}
                <th className="p-4 font-semibold">RFQ Title</th>
                <th className="p-4 font-semibold">Vendor</th>
                <th className="p-4 font-semibold">Total Price</th>
                <th className="p-4 font-semibold">Delivery Time</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && filteredQuotes.length === 0 ? (
                <tr><td colSpan={user?.role === 'Procurement Officer' ? "7" : "6"} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredQuotes.length === 0 ? (
                <tr><td colSpan={user?.role === 'Procurement Officer' ? "7" : "6"} className="p-8 text-center text-gray-500">No quotations found.</td></tr>
              ) : (
                filteredQuotes.map(quote => (
                  <tr key={quote._id} className="hover:bg-gray-50 transition-colors">
                    {user?.role === 'Procurement Officer' && (
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" 
                          checked={selectedQuoteIds.includes(quote._id)}
                          onChange={() => handleCheckboxChange(quote._id)}
                        />
                      </td>
                    )}
                    <td className="p-4 font-medium text-gray-900">{quote.rfqId?.title || 'Unknown RFQ'}</td>
                    <td className="p-4 text-gray-600">{quote.vendorId?.name || 'Unknown Vendor'}</td>
                    <td className="p-4 font-semibold text-gray-800">${quote.totalAmount?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-gray-600">{quote.items?.[0]?.deliveryTimeline || 'N/A'} days</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${quote.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : quote.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded shadow-sm transition-colors cursor-pointer" onClick={() => handleViewQuote(quote)}>
                          <Eye size={16} /> View
                        </button>
                        {user?.role === 'Manager' && quote.status === 'Pending' && (
                          <>
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors cursor-pointer" onClick={() => handleApprove(quote._id)}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 bg-white border border-red-200 rounded shadow-sm transition-colors cursor-pointer" onClick={() => handleReject(quote._id)}>
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {user?.role === 'Procurement Officer' && quote.status === 'Approved' && (
                          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors cursor-pointer" onClick={() => handleCreatePO(quote._id)}>
                            <CheckCircle size={14} /> Generate PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare Modal */}
      {showCompareModal && comparisonList.length > 0 && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Scale className="text-indigo-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800">Quotation Comparison Matrix</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => { setShowCompareModal(false); setSelectedQuoteIds([]); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
                Comparing quotations submitted for RFQ: <strong>{comparisonList[0]?.rfqId?.title}</strong>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparisonList.map(quote => {
                  const isLowestCost = lowestCostQuote?._id === quote._id;
                  const isFastestDeliv = fastestDeliveryQuote?._id === quote._id;
                  
                  return (
                    <div 
                      key={quote._id} 
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col ${
                        isLowestCost 
                          ? 'border-emerald-500 bg-emerald-50/20 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{quote.vendorId?.name}</h4>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
                            <span>Rating: {quote.vendorId?.rating?.toFixed(1) || '0.0'}</span>
                            <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {isLowestCost && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <Check size={12} /> Lowest Cost
                            </span>
                          )}
                          {isFastestDeliv && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <Calendar size={12} /> Fastest Delivery
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-100/50 rounded-xl p-4 mb-4 text-center border border-gray-200/50">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Total Quotation Price</span>
                        <span className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-0.5">
                          <DollarSign size={20} className="text-gray-500 shrink-0" />
                          {quote.totalAmount?.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2 border-b border-gray-100 pb-1">Items Cost & Delivery</span>
                          <div className="space-y-2">
                            {quote.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1">
                                <span className="text-gray-700 font-medium">{item.name} <span className="text-gray-400 font-normal">({item.quantity} units)</span></span>
                                <span className="font-semibold text-gray-800">${item.price?.toFixed(2)}/unit ({item.deliveryTimeline} days)</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {quote.notes && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100 text-xs text-gray-600 mt-2">
                            <strong>Vendor Terms:</strong> {quote.notes}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        {quote.status === 'Approved' ? (
                          <div className="text-center text-emerald-600 font-bold text-sm bg-emerald-50 rounded-lg py-2 border border-emerald-200">
                            Approved Quotation
                          </div>
                        ) : quote.status === 'Rejected' ? (
                          <div className="text-center text-red-600 font-bold text-sm bg-red-50 rounded-lg py-2 border border-red-200">
                            Rejected Quotation
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {user?.role === 'Manager' && (
                              <>
                                <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer" onClick={() => handleApprove(quote._id)}>
                                  Approve
                                </button>
                                <button className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer" onClick={() => handleReject(quote._id)}>
                                  Reject
                                </button>
                              </>
                            )}
                            {user?.role === 'Procurement Officer' && (
                              <div className="text-center text-gray-500 font-semibold text-xs w-full py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                Pending Approval
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer" 
                onClick={() => { setShowCompareModal(false); setSelectedQuoteIds([]); }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Quotation Details Modal */}
      {showViewModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">Quotation Details</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium block">RFQ Title</span>
                  <span className="font-bold text-gray-900">{selectedQuote.rfqId?.title || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Vendor</span>
                  <span className="font-bold text-gray-900">{selectedQuote.vendorId?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Total Value</span>
                  <span className="font-extrabold text-indigo-600 text-lg">${selectedQuote.totalAmount?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                    selectedQuote.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 
                    selectedQuote.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>{selectedQuote.status}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h5 className="font-semibold text-gray-800 mb-3">Itemized Quotation Breakdown</h5>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 divide-y divide-gray-200">
                  {selectedQuote.items?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0 text-sm">
                      <div>
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">Quantity: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">${item.price?.toFixed(2)}/unit</div>
                        <div className="text-xs text-gray-400">Timeline: {item.deliveryTimeline} days</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700">
                  <strong>Notes & Delivery Terms:</strong> {selectedQuote.notes}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {user?.role === 'Manager' && selectedQuote.status === 'Pending' && (
                <>
                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer" onClick={() => handleApprove(selectedQuote._id)}>
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer" onClick={() => handleReject(selectedQuote._id)}>
                    Reject
                  </button>
                </>
              )}
              <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
