import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, Clock } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity?limit=100');
      setLogs(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatActivityText = (act) => {
    const action = act.action;
    const entity = act.entity;
    const details = act.details || {};
    
    let target = '';
    if (entity === 'RFQ') target = details.title || 'an RFQ';
    else if (entity === 'Vendor') target = details.name || 'a vendor';
    else if (entity === 'Quotation') target = `Quotation for "${details.rfqTitle || 'RFQ'}"`;
    else if (entity === 'Purchase Order') target = details.poNumber || 'a PO';
    else if (entity === 'Invoice') target = details.invoiceNumber || 'an invoice';
    
    return `${action} ${entity.toLowerCase()} ${target}`;
  };

  const filteredLogs = logs.filter(log => {
    const userName = log.userId?.name || '';
    const action = log.action || '';
    const entity = log.entity || '';
    const formatted = formatActivityText(log);
    const matchesSearch = 
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatted.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEntity = entityFilter === '' || entity === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">System Activity Audit Logs</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all bg-white text-sm" 
              placeholder="Search logs by keyword..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <Filter size={16} className="text-gray-400" />
            <select 
              className="p-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="RFQ">RFQ</option>
              <option value="Vendor">Vendor</option>
              <option value="Quotation">Quotation</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold w-48">Timestamp</th>
                <th className="p-4 font-semibold w-56">User</th>
                <th className="p-4 font-semibold w-36">Entity Type</th>
                <th className="p-4 font-semibold">Action / Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && filteredLogs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No matching activity logs found.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-800 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {log.userId?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                        <div>
                          <div className="text-gray-900">{log.userId?.name || 'System / Guest'}</div>
                          <div className="text-xxs text-gray-400">{log.userId?.role || 'Guest'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide">
                        {log.entity}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700 font-medium">{formatActivityText(log)}</td>
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

export default ActivityLogs;
