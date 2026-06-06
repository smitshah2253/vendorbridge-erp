import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit, Trash2, X, Star } from 'lucide-react';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    gstNumber: '',
    contactPerson: '',
    rating: 0,
    status: 'Pending'
  });
  const [errors, setErrors] = useState({});

  const fetchVendors = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/vendors?search=${query}`);
      setVendors(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchVendors(val);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if(errors[name]) {
      setErrors({...errors, [name]: null});
    }
  };

  const validate = () => {
    const errs = {};
    if(!formData.name.trim()) errs.name = "Vendor name is required";
    if(!formData.email) errs.email = "Email is required";
    else if(!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";
    if(!formData.phone.trim()) errs.phone = "Phone number is required";
    if(!formData.category.trim()) errs.category = "Category is required";
    if(!formData.gstNumber.trim()) errs.gstNumber = "GST Number is required";
    if(!formData.contactPerson.trim()) errs.contactPerson = "Contact person is required";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validate()) return;

    try {
      if (isEditMode) {
        await api.put(`/vendors/${editingId}`, formData);
      } else {
        await api.post('/vendors', formData);
      }
      setShowModal(false);
      resetForm();
      fetchVendors(searchQuery);
    } catch (err) {
      console.error("Failed to save vendor", err);
      alert(err.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setFormData({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      category: vendor.category || '',
      gstNumber: vendor.gstNumber || '',
      contactPerson: vendor.contactPerson || '',
      rating: vendor.rating || 0,
      status: vendor.status || 'Pending'
    });
    setEditingId(vendor._id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.delete(`/vendors/${id}`);
        fetchVendors(searchQuery);
      } catch (err) {
        console.error("Failed to delete vendor", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', category: '', gstNumber: '', contactPerson: '', rating: 0, status: 'Pending' });
    setIsEditMode(false);
    setEditingId(null);
    setErrors({});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vendor Management</h2>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Search vendors..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Contact Person</th>
                <th className="p-4 font-semibold">Rating</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && vendors.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : vendors.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No vendors found.</td></tr>
              ) : (
                vendors.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{vendor.name}</div>
                      <div className="text-xs text-gray-400">GST: {vendor.gstNumber}</div>
                    </td>
                    <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{vendor.category}</span></td>
                    <td className="p-4">
                      <div className="text-sm text-gray-800">{vendor.email}</div>
                      <div className="text-xs text-gray-500">{vendor.phone}</div>
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{vendor.contactPerson || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-700">{vendor.rating?.toFixed(1) || '0.0'}</span>
                        <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${vendor.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : vendor.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer" onClick={() => handleEdit(vendor)}>
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" onClick={() => handleDelete(vendor._id)}>
                          <Trash2 size={16} />
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Vendor Details' : 'Register New Vendor'}</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => { resetForm(); setShowModal(false); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                  <input type="text" name="name" className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.name} onChange={handleChange} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.email} onChange={handleChange} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" name="phone" className={`w-full px-4 py-2 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.phone} onChange={handleChange} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" name="category" placeholder="e.g. IT, Supplies" className={`w-full px-4 py-2 rounded-lg border ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.category} onChange={handleChange} />
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" name="gstNumber" className={`w-full px-4 py-2 rounded-lg border ${errors.gstNumber ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.gstNumber} onChange={handleChange} />
                    {errors.gstNumber && <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" name="contactPerson" className={`w-full px-4 py-2 rounded-lg border ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-200 outline-none`} value={formData.contactPerson} onChange={handleChange} placeholder="Full Name" />
                  {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                </div>

                {isEditMode && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select name="status" className="w-full p-2 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 outline-none" value={formData.status} onChange={handleChange}>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating ({Number(formData.rating).toFixed(1)} stars)</label>
                      <input 
                        type="range" 
                        name="rating" 
                        min="0" 
                        max="5" 
                        step="0.5" 
                        className="w-full mt-2 accent-indigo-600 cursor-pointer" 
                        value={formData.rating} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button type="button" className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" onClick={() => { resetForm(); setShowModal(false); }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                    {isEditMode ? 'Update Vendor' : 'Save Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
