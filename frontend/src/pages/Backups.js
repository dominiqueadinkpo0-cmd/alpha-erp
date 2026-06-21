import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import StatCard from '../components/StatCard';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const columns = [
  {
    key: 'filename', label: 'Backup File',
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg"><Database size={18} className="text-green-600" /></div>
        <span className="font-mono text-sm text-gray-900">{v}</span>
      </div>
    )
  },
  {
    key: 'size', label: 'Size',
    render: (v) => <span className="text-gray-600">{formatSize(v)}</span>
  },
  {
    key: 'createdAt', label: 'Created',
    render: (v) => new Date(v).toLocaleString()
  },
  {
    key: 'actions', label: 'Actions', sortable: false,
    render: (_, row) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => row._onRestore(row)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={14} /> Restore
        </button>
        <button
          onClick={() => row._onDelete(row)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    )
  },
];

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', backup: null });

  useEffect(() => { loadBackups(); }, []);

  const loadBackups = async () => {
    try {
      const res = await api.get('/backup/list');
      setBackups(res.data);
    } catch (error) {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post('/backup/create');
      toast.success(`Backup created: ${res.data.filename}`);
      loadBackups();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup) => {
    try {
      await api.post('/backup/restore', { filename: backup.filename });
      toast.success('Backup restored successfully');
      setConfirmDialog({ open: false, type: '', backup: null });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to restore backup');
    }
  };

  const handleDelete = async (backup) => {
    try {
      await api.delete(`/backup/${backup.filename}`);
      toast.success('Backup deleted');
      setConfirmDialog({ open: false, type: '', backup: null });
      loadBackups();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete backup');
    }
  };

  const enrichedData = backups.map(b => ({
    ...b,
    _onRestore: (item) => setConfirmDialog({ open: true, type: 'restore', backup: item }),
    _onDelete: (item) => setConfirmDialog({ open: true, type: 'delete', backup: item })
  }));

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Backups" value={backups.length} icon={Database} color="bg-green-500" />
        <StatCard title="Total Size" value={formatSize(totalSize)} icon={HardDrive} color="bg-blue-500" />
        <StatCard title="Last Backup" value={backups.length > 0 ? new Date(backups[0].createdAt).toLocaleDateString() : 'None'} icon={Download} color="bg-purple-500" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Available Backups</h3>
        <div className="flex items-center gap-3">
          <button onClick={loadBackups} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
          >
            <Download size={18} />
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={enrichedData} loading={loading} emptyMessage="No backups available" />

      <ConfirmDialog
        isOpen={confirmDialog.open && confirmDialog.type === 'restore'}
        onClose={() => setConfirmDialog({ open: false, type: '', backup: null })}
        onConfirm={() => handleRestore(confirmDialog.backup)}
        title="Restore Backup"
        message={`Are you sure you want to restore from "${confirmDialog.backup?.filename}"? This will overwrite the current database.`}
        confirmText="Restore"
        confirmColor="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmDialog
        isOpen={confirmDialog.open && confirmDialog.type === 'delete'}
        onClose={() => setConfirmDialog({ open: false, type: '', backup: null })}
        onConfirm={() => handleDelete(confirmDialog.backup)}
        title="Delete Backup"
        message={`Are you sure you want to delete "${confirmDialog.backup?.filename}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
