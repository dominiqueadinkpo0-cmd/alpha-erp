import React, { useState, useEffect } from 'react';
import { Settings, Bell, Mail, MessageSquare, Calendar, Link, Unlink, Check, X, TestTube } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [integrations, setIntegrations] = useState({ google: { connected: false } });
  const [notifications, setNotifications] = useState({
    email_enabled: true,
    whatsapp_enabled: false,
    whatsapp_number: '',
    daily_report: true,
    stock_alerts: true,
    invoice_alerts: true,
    project_updates: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [intRes, notifRes] = await Promise.all([
        api.get('/integrations/google/status'),
        api.get('/notifications/settings')
      ]);
      setIntegrations({ google: intRes.data });
      setNotifications(notifRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await api.get('/integrations/google/auth');
      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to initialize Google connection');
    }
  };

  const handleGoogleDisconnect = async () => {
    if (window.confirm('Disconnect Google Calendar?')) {
      try {
        await api.delete('/integrations/google/disconnect');
        setIntegrations({ google: { connected: false } });
        toast.success('Google Calendar disconnected');
      } catch (error) {
        toast.error('Failed to disconnect');
      }
    }
  };

  const handleGoogleSync = async () => {
    try {
      const res = await api.post('/integrations/google/sync');
      toast.success(`Synced ${res.data.synced} events`);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/settings', notifications);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await api.post('/notifications/test-email');
      toast.success('Test email sent');
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  const handleTestWhatsApp = async () => {
    if (!notifications.whatsapp_number) {
      toast.error('Enter WhatsApp number first');
      return;
    }
    try {
      await api.post('/notifications/test-whatsapp', { phone: notifications.whatsapp_number });
      toast.success('Test WhatsApp sent');
    } catch (error) {
      toast.error('Failed to send test WhatsApp');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 dark:text-gray-300">Loading...</div>;
  }

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Settings className="text-gray-600 dark:text-gray-400" size={28} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-[#334155]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <Mail size={20} /> Email Notifications
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                  <div>
                    <p className="font-medium dark:text-gray-200">Email Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts via email</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications.email_enabled}
                    onChange={(e) => setNotifications({...notifications, email_enabled: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${notifications.email_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.email_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </label>

              <button onClick={handleTestEmail} className="premium-button flex items-center gap-2">
                <TestTube size={16} /> Send Test Email
              </button>
            </div>
          </div>

          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <MessageSquare size={20} /> WhatsApp Notifications
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl cursor-pointer">
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-green-600 dark:text-green-400" size={20} />
                  <div>
                    <p className="font-medium dark:text-gray-200">WhatsApp Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts via WhatsApp</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications.whatsapp_enabled}
                    onChange={(e) => setNotifications({...notifications, whatsapp_enabled: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${notifications.whatsapp_enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications.whatsapp_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={notifications.whatsapp_number}
                  onChange={(e) => setNotifications({...notifications, whatsapp_number: e.target.value})}
                  placeholder="+33612345678"
                  className="premium-input w-full dark:bg-[#1e293b] dark:border-[#334155] dark:text-gray-100"
                />
              </div>

              <button onClick={handleTestWhatsApp} className="premium-button flex items-center gap-2">
                <TestTube size={16} /> Send Test WhatsApp
              </button>
            </div>
          </div>

          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Notification Types</h2>
            <div className="space-y-3">
              {[
                { key: 'daily_report', label: 'Daily Report', desc: 'Summary of daily activity' },
                { key: 'stock_alerts', label: 'Stock Alerts', desc: 'Low inventory warnings' },
                { key: 'invoice_alerts', label: 'Invoice Alerts', desc: 'Overdue payment reminders' },
                { key: 'project_updates', label: 'Project Updates', desc: 'Task and project changes' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl cursor-pointer">
                  <div>
                    <p className="font-medium dark:text-gray-200">{item.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSaveNotifications} disabled={saving} className="premium-button w-full">
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold dark:text-gray-100">Google Calendar</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sync events and deadlines</p>
                </div>
              </div>
              <span className={integrations.google.connected ? 'status-connected' : 'status-disconnected'}>
                {integrations.google.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl">
                <h3 className="font-medium mb-2 dark:text-gray-200">Features:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    {integrations.google.connected ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-400" />}
                    Auto-sync calendar events
                  </li>
                  <li className="flex items-center gap-2">
                    {integrations.google.connected ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-400" />}
                    Create events from ERP
                  </li>
                  <li className="flex items-center gap-2">
                    {integrations.google.connected ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-400" />}
                    Project deadline sync
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                {integrations.google.connected ? (
                  <>
                    <button onClick={handleGoogleSync} className="premium-button flex items-center gap-2">
                      <Calendar size={16} /> Sync Now
                    </button>
                    <button onClick={handleGoogleDisconnect} className="px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                      <Unlink size={16} /> Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={handleGoogleConnect} className="premium-button flex items-center gap-2">
                    <Link size={16} /> Connect Google Calendar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="premium-card p-6 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold dark:text-gray-100">Slack</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold dark:text-gray-100">Microsoft Teams</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
