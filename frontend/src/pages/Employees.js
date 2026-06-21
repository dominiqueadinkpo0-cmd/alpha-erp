import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCog, Mail, Calendar, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 12;

const defaultForm = { user_id: '', employee_number: '', position: '', department: '', hire_date: '', salary: '', status: 'active', emergency_contact: '', emergency_phone: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { loadEmployees(); }, [search, departmentFilter]);

  const loadEmployees = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      const res = await api.get('/employees', { params });
      setEmployees(res.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, formData);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee created');
      }
      setShowModal(false);
      setEditingEmployee(null);
      setFormData(defaultForm);
      loadEmployees();
    } catch (error) {
      toast.error('Failed to save employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({ user_id: employee.user_id || '', employee_number: employee.employee_number, position: employee.position || '', department: employee.department || '', hire_date: employee.hire_date?.split('T')[0] || '', salary: employee.salary || '', status: employee.status, emergency_contact: employee.emergency_contact || '', emergency_phone: employee.emergency_phone || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try { await api.delete(`/employees/${id}`); toast.success('Employee deleted'); loadEmployees(); } catch (error) { toast.error('Failed to delete employee'); }
    }
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const paged = employees.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search employees..." />
          <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100">
            <option value="">All Departments</option>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <button onClick={() => { setFormData(defaultForm); setEditingEmployee(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={20} /> Add Employee
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 h-52 animate-pulse" />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No employees found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((employee) => (
              <div key={employee.id} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <UserCog size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{employee.user_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{employee.position || 'No position'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{employee.status}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><span className="font-mono bg-gray-100 dark:bg-[#0f172a] px-2 py-0.5 rounded">{employee.employee_number}</span></div>
                  {employee.department && <div className="text-sm text-gray-600 dark:text-gray-400">Department: {employee.department}</div>}
                  {employee.user_email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail size={14} /> {employee.user_email}</div>}
                  {employee.hire_date && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Calendar size={14} /> Joined: {new Date(employee.hire_date).toLocaleDateString()}</div>}
                  {employee.salary && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><DollarSign size={14} /> €{parseFloat(employee.salary).toLocaleString()}</div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(employee)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg hover:bg-gray-50 dark:hover:bg-[#334155] text-sm dark:text-gray-300">Edit</button>
                  <button onClick={() => handleDelete(employee.id)} className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEmployee ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Number *</label>
            <input type="text" value={formData.employee_number} onChange={(e) => setFormData({...formData, employee_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
            <input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hire Date</label>
              <input type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary (€)</label>
              <input type="number" step="0.01" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
            <input type="text" value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
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
