import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Plus, Search, Eye, X, Upload } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const RFQs = () => {
  const { user } = useContext(AuthContext);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // RFQ Creation form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [{ name: '', quantity: 1, unit: 'pcs' }],
    deadline: '',
    assignedVendors: []
  });
  const [errors, setErrors] = useState({});

  // Quotation Submission state
  const [existingQuoteId, setExistingQuoteId] = useState(null);
  const [quoteFormData, setQuoteFormData] = useState({
    items: [],
    notes: ''
  });
  const [quoteErrors, setQuoteErrors] = useState({});

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rfqs');
      setRfqs(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch RFQs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const res = await api.get(`/vendors?search=${user.email}`);
        const matchedVendors = res.data.data || res.data;
        if (Array.isArray(matchedVendors) && matchedVendors.length > 0) {
          const exactMatch = matchedVendors.find(v => v.email?.toLowerCase() === user.email?.toLowerCase());
          setVendorProfile(exactMatch || matchedVendors[0]);
        }
      } catch (err) {
        console.error("Failed to fetch vendor profile", err);
      }
    };

    fetchRFQs();
    if (user?.role === 'Procurement Officer' || user?.role === 'Admin') {
      fetchVendors();
    } else if (user?.role === 'Vendor') {
      fetchVendorProfile();
    }
  }, [user]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, unit: 'pcs' }] });
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleVendorSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({ ...formData, assignedVendors: selected });
    if(errors.assignedVendors) setErrors({...errors, assignedVendors: null});
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const uploadPayload = new FormData();
    uploadPayload.append('file', file);

    try {
      const res = await api.post('/rfqs/upload', uploadPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadedFiles(prev => [...prev, {
        filename: res.data.data.filename,
        url: res.data.data.url
      }]);
    } catch (err) {
      console.error("Failed to upload file", err);
      alert("Failed to upload attachment");
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if(!formData.title.trim()) errs.title = "Title is required";
    if(!formData.description.trim()) errs.description = "Description is required";
    if(!formData.deadline) errs.deadline = "Deadline is required";
    if(formData.assignedVendors.length === 0) errs.assignedVendors = "Assign at least one vendor";
    
    const itemsValid = formData.items.every(i => i.name && i.quantity > 0 && i.unit);
    if (!itemsValid) errs.items = "All items must have a valid name, quantity > 0, and unit";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validate()) return;

    try {
      await api.post('/rfqs', {
        ...formData,
        attachments: uploadedFiles
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        items: [{ name: '', quantity: 1, unit: 'pcs' }],
        deadline: '',
        assignedVendors: []
      });
      setUploadedFiles([]);
      fetchRFQs();
    } catch (err) {
      console.error("Failed to create RFQ", err);
      alert(err.response?.data?.message || 'Failed to create RFQ');
    }
  };

  const handleViewRFQ = async (rfq) => {
    setSelectedRFQ(rfq);
    setQuoteErrors({});
    setExistingQuoteId(null);
    setShowViewModal(true);

    let currentVendorId = vendorProfile?._id;
    if (!currentVendorId && user?.role === 'Vendor') {
      try {
        const resProfile = await api.get(`/vendors?search=${user.email}`);
        const matchedVendors = resProfile.data.data || resProfile.data;
        if (Array.isArray(matchedVendors) && matchedVendors.length > 0) {
          const exact = matchedVendors.find(v => v.email?.toLowerCase() === user.email?.toLowerCase());
          currentVendorId = exact?._id || matchedVendors[0]._id;
        }
      } catch (err) {
        console.error("Failed to load vendor profile", err);
      }
    }

    let existingQuote = null;
    if (user?.role === 'Vendor' && currentVendorId) {
      try {
        const resQuote = await api.get(`/quotations?rfqId=${rfq._id}&vendorId=${currentVendorId}`);
        const quotes = resQuote.data.data || resQuote.data;
        if (Array.isArray(quotes) && quotes.length > 0) {
          existingQuote = quotes[0];
          setExistingQuoteId(existingQuote._id);
        }
      } catch (err) {
        console.error("Failed to check existing quotation", err);
      }
    }

    if (existingQuote) {
      setQuoteFormData({
        items: rfq.items.map(rfqItem => {
          const match = existingQuote.items?.find(qi => qi.name === rfqItem.name);
          return {
            name: rfqItem.name,
            quantity: rfqItem.quantity,
            price: match ? String(match.price) : '',
            deliveryTimeline: match ? String(match.deliveryTimeline) : ''
          };
        }),
        notes: existingQuote.notes || ''
      });
    } else {
      setQuoteFormData({
        items: rfq.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: '',
          deliveryTimeline: ''
        })),
        notes: ''
      });
    }
  };

  const handleQuoteItemChange = (index, field, value) => {
    const newItems = [...quoteFormData.items];
    newItems[index][field] = value;
    setQuoteFormData({ ...quoteFormData, items: newItems });
    if (quoteErrors[`item_${index}_${field}`]) {
      const newErrors = { ...quoteErrors };
      delete newErrors[`item_${index}_${field}`];
      setQuoteErrors(newErrors);
    }
  };

  const validateQuote = () => {
    const errs = {};
    quoteFormData.items.forEach((item, index) => {
      const priceNum = parseFloat(item.price);
      if (!item.price || isNaN(priceNum) || priceNum <= 0) {
        errs[`item_${index}_price`] = "Price must be a number greater than 0";
      }
      const days = parseInt(item.deliveryTimeline);
      if (!item.deliveryTimeline || isNaN(days) || days <= 0) {
        errs[`item_${index}_deliveryTimeline`] = "Timeline must be a number greater than 0";
      }
    });
    setQuoteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!validateQuote()) return;

    let currentVendorId = vendorProfile?._id;
    if (!currentVendorId) {
      try {
        const resProfile = await api.get(`/vendors?search=${user.email}`);
        const matchedVendors = resProfile.data.data || resProfile.data;
        if (Array.isArray(matchedVendors) && matchedVendors.length > 0) {
          const exact = matchedVendors.find(v => v.email?.toLowerCase() === user.email?.toLowerCase());
          currentVendorId = exact?._id || matchedVendors[0]._id;
        }
      } catch {
        alert("Failed to resolve vendor profile.");
        return;
      }
    }

    if (!currentVendorId) {
      alert("Vendor profile not found. Please contact the administrator.");
      return;
    }

    try {
      const payload = {
        rfqId: selectedRFQ._id,
        vendorId: currentVendorId,
        items: quoteFormData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          deliveryTimeline: String(item.deliveryTimeline)
        })),
        notes: quoteFormData.notes,
        status: 'Pending' // Always reset/maintain pending approval status upon edit or submit
      };

      if (existingQuoteId) {
        await api.put(`/quotations/${existingQuoteId}`, payload);
        alert('Quotation updated successfully!');
      } else {
        await api.post('/quotations', payload);
        alert('Quotation submitted successfully!');
      }
      setShowViewModal(false);
    } catch (err) {
      console.error("Failed to submit quotation", err);
      alert(err.response?.data?.message || 'Failed to submit quotation');
    }
  };

  const filteredRFQs = rfqs.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Request for Quotations (RFQs)</h2>
        {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            onClick={() => { setUploadedFiles([]); setShowModal(true); }}
          >
            <Plus size={18} /> Create RFQ
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
              placeholder="Search RFQs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Created By</th>
                <th className="p-4 font-semibold">Deadline</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && filteredRFQs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredRFQs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No RFQs found.</td></tr>
              ) : (
                filteredRFQs.map(rfq => (
                  <tr key={rfq._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{rfq.title}</div>
                      <div className="text-xs text-gray-400 max-w-sm truncate">{rfq.description}</div>
                    </td>
                    <td className="p-4 text-gray-600">{rfq.createdBy?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rfq.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded shadow-sm transition-colors cursor-pointer" onClick={() => handleViewRFQ(rfq)}>
                          <Eye size={16} /> View
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

      {showModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">Create New RFQ</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Title</label>
                  <input type="text" className={`w-full px-4 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.title} onChange={e => {setFormData({...formData, title: e.target.value}); setErrors({...errors, title: null})}} />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className={`w-full px-4 py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} rows="3" value={formData.description} onChange={e => {setFormData({...formData, description: e.target.value}); setErrors({...errors, description: null})}}></textarea>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Items Requested</label>
                    <button type="button" className="text-xs font-semibold bg-white border border-gray-300 px-2 py-1 rounded shadow-sm hover:bg-gray-50 cursor-pointer" onClick={addItem}>+ Add Item</button>
                  </div>
                  {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input type="text" className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none bg-white" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                      <input type="number" min="1" className="w-20 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none bg-white" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                      <input type="text" className="w-24 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none bg-white" placeholder="Unit" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} />
                      {formData.items.length > 1 && (
                        <button type="button" className="w-8 flex justify-center items-center text-red-500 hover:bg-red-50 rounded cursor-pointer" onClick={() => removeItem(index)}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm text-gray-700 cursor-pointer font-medium transition-colors">
                      <Upload size={16} />
                      Choose File
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                    </label>
                    {uploadingFile && <span className="text-xs text-gray-500 animate-pulse">Uploading file...</span>}
                  </div>
                  {uploadedFiles.length > 0 && (
                    <ul className="divide-y divide-gray-100 mt-2 bg-white rounded-lg border border-gray-200 px-3">
                      {uploadedFiles.map((f, idx) => (
                        <li key={idx} className="py-2 flex justify-between items-center text-sm text-gray-700">
                          <span>📄 {f.filename}</span>
                          <button type="button" className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer" onClick={() => removeAttachment(idx)}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input type="date" className={`w-full px-4 py-2 rounded-lg border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.deadline} onChange={e => {setFormData({...formData, deadline: e.target.value}); setErrors({...errors, deadline: null})}} />
                    {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vendors (Hold Ctrl to select multiple)</label>
                    <select multiple className={`w-full p-2 rounded-lg border ${errors.assignedVendors ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none h-32`} onChange={handleVendorSelect}>
                      {vendors.map(v => (
                        <option key={v._id} value={v._id} className="p-1 mb-1 rounded hover:bg-indigo-50">{v.name}</option>
                      ))}
                    </select>
                    {errors.assignedVendors && <p className="text-red-500 text-xs mt-1">{errors.assignedVendors}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button type="button" className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">Create RFQ</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">RFQ Details</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{selectedRFQ.title}</h4>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{selectedRFQ.description}</p>
                <div className="flex gap-6 mt-4 text-sm text-gray-500">
                  <span><strong>Deadline:</strong> {new Date(selectedRFQ.deadline).toLocaleDateString()}</span>
                  <span><strong>Created By:</strong> {selectedRFQ.createdBy?.name || 'N/A'}</span>
                </div>
              </div>

              {selectedRFQ.attachments && selectedRFQ.attachments.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Attachments</h5>
                  <div className="flex flex-col gap-2">
                    {selectedRFQ.attachments.map((file, idx) => {
                      const fileUrl = file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
                      return (
                        <a 
                          key={idx} 
                          href={fileUrl}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1"
                        >
                          📄 {file.filename}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <h5 className="font-semibold text-gray-800 mb-3">Items Requested</h5>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 divide-y divide-gray-200">
                  {selectedRFQ.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-600">{item.quantity} {item.unit || 'pcs'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {user?.role === 'Vendor' && (
                <form onSubmit={handleQuoteSubmit} className="border-t border-gray-100 pt-4 space-y-4">
                  <h5 className="font-bold text-gray-800 text-lg">
                    {existingQuoteId ? 'Edit Your Quotation' : 'Submit Your Quotation'}
                  </h5>
                  
                  <div className="space-y-4">
                    {quoteFormData.items.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-indigo-700">{item.name} <span className="text-xs text-gray-500">(Qty: {item.quantity})</span></span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              min="0.01"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${quoteErrors[`item_${index}_price`] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'} focus:ring-2 outline-none bg-white`}
                              value={item.price} 
                              onChange={e => handleQuoteItemChange(index, 'price', e.target.value)} 
                              placeholder="0.00"
                            />
                            {quoteErrors[`item_${index}_price`] && <p className="text-red-500 text-xs mt-1">{quoteErrors[`item_${index}_price`]}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Time (days)</label>
                            <input 
                              type="number" 
                              min="1"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${quoteErrors[`item_${index}_deliveryTimeline`] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'} focus:ring-2 outline-none bg-white`}
                              value={item.deliveryTimeline} 
                              onChange={e => handleQuoteItemChange(index, 'deliveryTimeline', e.target.value)} 
                              placeholder="e.g. 5"
                            />
                            {quoteErrors[`item_${index}_deliveryTimeline`] && <p className="text-red-500 text-xs mt-1">{quoteErrors[`item_${index}_deliveryTimeline`]}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Notes / Terms</label>
                    <textarea 
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 outline-none" 
                      rows="3" 
                      value={quoteFormData.notes} 
                      onChange={e => setQuoteFormData({...quoteFormData, notes: e.target.value})}
                      placeholder="Enter additional terms or delivery notes..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 bg-gray-50/20">
                    <button type="button" className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm cursor-pointer" onClick={() => setShowViewModal(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm cursor-pointer">
                      {existingQuoteId ? 'Update Quotation' : 'Submit Quotation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQs;
