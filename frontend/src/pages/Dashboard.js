import React, { useState, useEffect } from 'react';
import { Package, Users, FolderKanban, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 dark:text-gray-300">Loading...</div>;
  if (!stats) return <div className="text-center text-gray-500 dark:text-gray-400">No data available</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Products" value={stats.products.count} icon={Package} color="bg-blue-500" sub={`€${stats.products.total_value.toLocaleString()} value`} />
        <StatCard title="Contacts" value={stats.contacts.count} icon={Users} color="bg-green-500" />
        <StatCard title="Active Projects" value={stats.projects.active} icon={FolderKanban} color="bg-purple-500" />
        <StatCard title="Employees" value={stats.employees.count} icon={FileText} color="bg-orange-500" />
      </div>

      {stats.low_stock > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={24} />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Low Stock Alert</p>
              <p className="text-yellow-700 dark:text-yellow-400">{stats.low_stock} products are below minimum quantity</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold dark:text-gray-100 mb-4">Recent Projects</h3>
          <div className="space-y-4">
            {stats.recent_projects?.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                <div>
                  <p className="font-medium dark:text-gray-200">{project.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.client_name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : project.status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{project.status}</span>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold dark:text-gray-100 mb-4">Pending Invoices</h3>
          <div className="space-y-4">
            {stats.pending_invoices?.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                <div>
                  <p className="font-medium dark:text-gray-200">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.contact_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold dark:text-gray-100">€{invoice.total.toLocaleString()}</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.monthly_revenue?.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold dark:text-gray-100 mb-4 flex items-center gap-2"><TrendingUp size={20} /> Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_revenue.map(r => ({ month: new Date(r.month).toLocaleDateString('en-US', { month: 'short' }), revenue: parseFloat(r.revenue) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => `€${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
