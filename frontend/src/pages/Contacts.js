import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Mail, Phone } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 12;

const defaultForm = { type: 'customer', first_name: '', last_name: '', email: '', phone: '', company: '', address: '', city: '', country: '', notes: '' };

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { loadContacts(); }, [search, typeFilter]);

  const loadContacts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/contacts', { params });
      setContacts(res.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
        toast.success('Contact updated');
      } else {
        await api.post('/contacts', formData);
        toast.success('Contact created');
      }
      setShowModal(false);
      setEditingContact(null);
      setFormData(defaultForm);
      loadContacts();
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({ type: contact.type, first_name: contact.first_name, last_name: contact.last_name || '', email: contact.email || '', phone: contact.phone || '', company: contact.company || '', address: contact.address || '', city: contact.city || '', country: contact.country || '', notes: contact.notes || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contact?')) {
      try {
        await api.delete(`/contacts/${id}`);
        toast.success('Contact deleted');
        loadContacts();
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
  };

  const totalPages = Math.ceil(contacts.length / ITEMS_PER_PAGE);
  const paged = contacts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search contacts..." />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100">
            <option value="">All Types</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
          </select>
        </div>
        <button onClick={() => { setFormData(defaultForm); setEditingContact(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={20} /> Add Contact
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 h-48 animate-pulse" />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No contacts found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((contact) => (
              <div key={contact.id} className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Users size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{contact.first_name} {contact.last_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company || 'No company'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${contact.type === 'customer' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>{contact.type}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {contact.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail size={14} /> {contact.email}</div>}
                  {contact.phone && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Phone size={14} /> {contact.phone}</div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(contact)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg hover:bg-gray-50 dark:hover:bg-[#334155] text-sm dark:text-gray-300">Edit</button>
                  <button onClick={() => handleDelete(contact.id)} className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingContact ? 'Edit Contact' : 'Add Contact'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
              <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" rows="2" />
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
