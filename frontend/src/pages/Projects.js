import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderKanban, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 10;

const defaultForm = { name: '', description: '', status: 'planning', priority: 'medium', start_date: '', end_date: '', budget: '', client_id: '', manager_id: '' };

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { loadProjects(); }, [search, statusFilter]);

  const loadProjects = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', { params });
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
        toast.success('Project updated');
      } else {
        await api.post('/projects', formData);
        toast.success('Project created');
      }
      setShowModal(false);
      setEditingProject(null);
      setFormData(defaultForm);
      loadProjects();
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '', status: project.status, priority: project.priority, start_date: project.start_date?.split('T')[0] || '', end_date: project.end_date?.split('T')[0] || '', budget: project.budget || '', client_id: project.client_id || '', manager_id: project.manager_id || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        toast.success('Project deleted');
        loadProjects();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paged = projects.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search projects..." />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100">
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button onClick={() => { setFormData(defaultForm); setEditingProject(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={20} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 h-52 animate-pulse" />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No projects found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paged.map((project) => (
              <div key={project.id} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><FolderKanban size={24} className="text-purple-600 dark:text-purple-400" /></div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.client_name || 'No client'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{project.status}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Calendar size={14} />{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No date'}</div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><DollarSign size={14} />€{parseFloat(project.budget || 0).toLocaleString()}</div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><CheckCircle size={14} />{project.completed_tasks || 0}/{project.task_count || 0} tasks</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium dark:text-gray-200">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.progress || 0}%` }} /></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(project)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg hover:bg-gray-50 dark:hover:bg-[#334155] text-sm dark:text-gray-300">Edit</button>
                  <button onClick={() => handleDelete(project.id)} className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
                <option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (€)</label>
            <input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" rows="3" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-[#334155] rounded-lg hover:bg-gray-50 dark:hover:bg-[#334155] dark:text-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
