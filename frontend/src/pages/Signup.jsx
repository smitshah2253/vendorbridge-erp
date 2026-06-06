import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Procurement Officer'
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error when typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({...validationErrors, [e.target.name]: null});
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    
    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";
    
    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6) errs.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      await signup(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-emerald-500 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-indigo-600 tracking-tight">Create Account</h2>
          <p className="text-gray-500 mt-2">Join VendorBridge ERP</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              name="name"
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={formData.name} 
              onChange={handleChange} 
              placeholder="John Doe"
            />
            {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={formData.email} 
              onChange={handleChange} 
              placeholder="you@example.com"
            />
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
            />
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="••••••••"
            />
            {validationErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              name="role" 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="Procurement Officer">Procurement Officer</option>
              <option value="Vendor">Vendor</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <UserPlus size={18} />
            Sign Up
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-800 transition-colors">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
