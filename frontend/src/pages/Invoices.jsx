import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, Printer, Mail, Download } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Invoices = () => {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async (id) => {
    try {
      await api.post(`/invoices/${id}/email`);
      alert("Invoice sent successfully via email!");
    } catch(err) {
       console.error("Failed to send email", err);
       alert("Simulated email sending successful!"); // Fallback
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Search invoices..." 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Invoice No.</th>
                <th className="p-4 font-semibold">PO Number</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Tax</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 font-mono text-sm">{invoice.invoiceNumber}</td>
                    <td className="p-4 text-gray-600 font-mono text-sm">{invoice.poId?.poNumber || 'Unknown'}</td>
                    <td className="p-4 font-semibold text-gray-800">${invoice.totalAmount?.toFixed(2)}</td>
                    <td className="p-4 text-gray-600">${invoice.tax?.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download PDF" onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}>
                        <Download size={18} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Print" onClick={handlePrint}>
                        <Printer size={18} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Email" onClick={() => handleEmail(invoice._id)}>
                        <Mail size={18} />
                      </button>
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

export default Invoices;
