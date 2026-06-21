import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, DollarSign, FolderKanban, Activity, Database, Clock, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const tabs = ['Overview', 'Users', 'Logs', 'Integrations', 'Settings'];

const integrationIcons = {
  google_calendar: { color: 'bg-blue-500', label: 'Google Calendar' },
  slack: { color: 'bg-purple-500', label: 'Slack' },
  teams: { color: 'bg-indigo-500', label: 'Microsoft Teams' }
};

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/employees'),
      api.get('/notifications').catch(() => ({ data: [] })),
      api.get('/integrations').catch(() => ({ data: [] }))
    ]).then(([statsRes, empRes, notifRes, intRes]) => {
      setStats(statsRes.data);
      setEmployees(empRes.data.employees || empRes.data || []);
      setLogs(notifRes.data.notifications || notifRes.data || []);
      setIntegrations(intRes.data || []);
    }).catch(err => {
      toast.error('Failed to load dashboard data');
    }).finally(() => setLoading(false));
  }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/employees/${userId}`, { is_active: !currentStatus });
      setEmployees(prev => prev.map(e =>
        e.id === userId ? { ...e, is_active: !currentStatus } : e
      ));
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const systemHealth = [
    { label: 'API Status', status: 'online', icon: Activity },
    { label: 'Database', status: 'online', icon: Database },
    { label: 'Uptime', status: 'online', icon: Clock }
  ];

  const integrationList = [
    { key: 'google_calendar', connected: integrations.some(i => i.provider === 'google_calendar') },
    { key: 'slack', connected: integrations.some(i => i.provider === 'slack') },
    { key: 'teams', connected: integrations.some(i => i.provider === 'teams') }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin dark:text-gray-400" size={24} /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-500 p-3 rounded-lg"><Shield size={24} className="text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Staff Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">System administration and monitoring</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-[#334155]">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: employees.length, icon: Users, color: 'bg-blue-500' },
              { label: 'Total Products', value: stats?.products?.count || 0, icon: Package, color: 'bg-green-500' },
              { label: 'Total Revenue', value: `€${(stats?.invoices?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500' },
              { label: 'Active Projects', value: stats?.projects?.active || 0, icon: FolderKanban, color: 'bg-orange-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon size={24} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemHealth.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                  <item.icon size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="flex-1 text-sm font-medium dark:text-gray-200">{item.label}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    item.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.status === 'online' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {item.status === 'online' ? 'Operational' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#334155]">
            <h3 className="text-lg font-semibold dark:text-gray-100">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <span className="font-medium dark:text-gray-200">{emp.first_name} {emp.last_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        emp.role === 'manager' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.department || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(emp.id, emp.is_active)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          emp.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {emp.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Logs' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#334155]">
            <h3 className="text-lg font-semibold dark:text-gray-100">System Logs</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity logs</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#334155]">
                {logs.map((log, i) => (
                  <div key={log.id || i} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                    <div className="flex items-start gap-3">
                      <Activity size={16} className="text-gray-400 dark:text-gray-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.title || log.message}</p>
                        {log.message && log.title && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{log.message}</p>}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrationList.map((item) => {
            const info = integrationIcons[item.key];
            return (
              <div key={item.key} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${info.color} p-3 rounded-lg`}>
                    <Wifi size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold dark:text-gray-100">{info.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {item.connected ? (
                    <>
                      <Wifi size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">System Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
              <div>
                <p className="font-medium dark:text-gray-200">Application Version</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ERP System v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
              <div>
                <p className="font-medium dark:text-gray-200">Environment</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Production</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
              <div>
                <p className="font-medium dark:text-gray-200">Last Backup</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Daily automated backups enabled</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
