import React, { useState, useEffect } from 'react';
import { ScrollText, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import StatCard from '../components/StatCard';

const ITEMS_PER_PAGE = 15;

const actionColors = {
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

const columns = [
  {
    key: 'created_at', label: 'Date',
    render: (v) => new Date(v).toLocaleString()
  },
  {
    key: 'user_name', label: 'User',
    render: (v, row) => (
      <div>
        <p className="font-medium text-gray-900">{v || 'System'}</p>
        <p className="text-xs text-gray-500">{row.user_email}</p>
      </div>
    )
  },
  {
    key: 'action', label: 'Action',
    render: (v) => {
      const method = v.split(' ')[0];
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[method] || 'bg-gray-100 text-gray-700'}`}>
          {v}
        </span>
      );
    }
  },
  { key: 'entity_type', label: 'Entity Type', render: (v) => v || '-' },
  { key: 'entity_id', label: 'Entity ID', render: (v) => v || '-' },
  {
    key: 'ip_address', label: 'IP Address',
    render: (v) => <span className="font-mono text-xs text-gray-500">{v || '-'}</span>
  },
];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ user_id: '', entity_type: '', date_from: '', date_to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => { loadLogs(); }, [page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const res = await api.get('/audit/logs', { params });
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ user_id: '', entity_type: '', date_from: '', date_to: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Actions" value={total} icon={ScrollText} color="bg-blue-500" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { loadLogs(); loadStats(); }} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={loadStats} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
            Statistics
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">User ID</label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
              <select
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="products">Products</option>
                <option value="contacts">Contacts</option>
                <option value="projects">Projects</option>
                <option value="invoices">Invoices</option>
                <option value="employees">Employees</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found" />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {stats && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Statistics (Last 30 Days)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Actions Per Day</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.actionsPerDay.map((row) => (
                  <div key={row.date} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.date}</span>
                    <span className="font-medium text-gray-900">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Users</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.topUsers.map((row) => (
                  <div key={row.user_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.user_name || row.email || 'Unknown'}</span>
                    <span className="font-medium text-gray-900">{row.action_count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Actions</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.topActions.map((row) => (
                  <div key={row.action} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-mono text-xs">{row.action}</span>
                    <span className="font-medium text-gray-900">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
