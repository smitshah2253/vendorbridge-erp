import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Email is invalid";
    
    if (!password) errs.password = "Password is required";
    
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-emerald-500 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-indigo-600 tracking-tight">VendorBridge ERP</h2>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
            />
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              className={`w-full px-4 py-2.5 rounded-lg border ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'} outline-none transition-all`}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <LogIn size={18} />
            Sign In
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
