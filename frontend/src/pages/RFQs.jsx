import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Plus, Search, Eye, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const RFQs = () => {
  const { user } = useContext(AuthContext);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [{ name: '', quantity: 1, unit: 'pcs' }],
    deadline: '',
    assignedVendors: []
  });
  const [errors, setErrors] = useState({});

  const fetchRFQs = async () => {
    try {
      const res = await api.get('/rfqs');
      setRfqs(res.data);
    } catch (err) {
      console.error("Failed to fetch RFQs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  useEffect(() => {
    fetchRFQs();
    if (user?.role === 'Procurement Officer' || user?.role === 'Admin') {
      fetchVendors();
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

  const validate = () => {
    const errs = {};
    if(!formData.title.trim()) errs.title = "Title is required";
    if(!formData.description.trim()) errs.description = "Description is required";
    if(!formData.deadline) errs.deadline = "Deadline is required";
    if(formData.assignedVendors.length === 0) errs.assignedVendors = "Assign at least one vendor";
    
    // Validate items
    const itemsValid = formData.items.every(i => i.name && i.quantity > 0 && i.unit);
    if (!itemsValid) errs.items = "All items must have a valid name, quantity > 0, and unit";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validate()) return;

    try {
      await api.post('/rfqs', formData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        items: [{ name: '', quantity: 1, unit: 'pcs' }],
        deadline: '',
        assignedVendors: []
      });
      fetchRFQs();
    } catch (err) {
      console.error("Failed to create RFQ", err);
      alert(err.response?.data?.message || 'Failed to create RFQ');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Request for Quotations (RFQs)</h2>
        {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            onClick={() => setShowModal(true)}
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
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : rfqs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No RFQs found.</td></tr>
              ) : (
                rfqs.map(rfq => (
                  <tr key={rfq._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{rfq.title}</td>
                    <td className="p-4 text-gray-600">{rfq.createdBy?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rfq.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded shadow-sm transition-colors">
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Items Requested</label>
                    <button type="button" className="text-xs font-medium bg-white border border-gray-300 px-2 py-1 rounded shadow-sm hover:bg-gray-50" onClick={addItem}>+ Add Item</button>
                  </div>
                  {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input type="text" className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                      <input type="number" min="1" className="w-20 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                      <input type="text" className="w-24 px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-indigo-500 outline-none" placeholder="Unit" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} />
                      {formData.items.length > 1 && (
                        <button type="button" className="w-8 flex justify-center items-center text-red-500 hover:bg-red-50 rounded" onClick={() => removeItem(index)}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
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
    </div>
  );
};

export default RFQs;
