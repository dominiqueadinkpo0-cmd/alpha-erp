import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 10;

const defaultForm = {
  type: 'invoice', contact_id: '', status: 'draft', issue_date: new Date().toISOString().split('T')[0],
  due_date: '', tax_rate: '20', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }], paid_amount: 0
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const columns = [
  {
    key: 'invoice_number', label: 'Invoice',
    render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><FileText size={20} className="text-blue-600 dark:text-blue-400" /></div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{v}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{row.type}</p>
        </div>
      </div>
    )
  },
  { key: 'contact_name', label: 'Contact' },
  { key: 'issue_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'total', label: 'Amount', render: (v) => `€${parseFloat(v).toFixed(2)}` },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(v)}`}>{v}</span> },
  {
    key: 'actions', label: 'Actions', sortable: false,
    render: (_, row) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => row._onEdit(row)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded"><Edit2 size={16} className="text-gray-600 dark:text-gray-400" /></button>
        <button onClick={() => row._onDelete(row.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded"><Trash2 size={16} className="text-red-600 dark:text-red-400" /></button>
      </div>
    )
  },
];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { loadInvoices(); loadContacts(); }, [search, typeFilter]);

  const loadInvoices = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/invoices', { params });
      setInvoices(res.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try { const res = await api.get('/contacts'); setContacts(res.data); } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, formData);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', formData);
        toast.success('Invoice created');
      }
      setShowModal(false);
      setEditingInvoice(null);
      setFormData(defaultForm);
      loadInvoices();
    } catch (error) {
      toast.error('Failed to save invoice');
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({ type: invoice.type, contact_id: invoice.contact_id, status: invoice.status, issue_date: invoice.issue_date?.split('T')[0] || '', due_date: invoice.due_date?.split('T')[0] || '', tax_rate: invoice.tax_rate, notes: invoice.notes || '', items: invoice.items || [{ description: '', quantity: 1, unit_price: 0 }], paid_amount: invoice.paid_amount || 0 });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); loadInvoices(); } catch (error) { toast.error('Failed to delete invoice'); }
    }
  };

  const addItem = () => setFormData({...formData, items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]});
  const removeItem = (index) => setFormData({...formData, items: formData.items.filter((_, i) => i !== index)});
  const updateItem = (index, field, value) => { const items = [...formData.items]; items[index] = {...items[index], [field]: value}; setFormData({...formData, items}); };
  const calculateTotal = () => { const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0); const tax = subtotal * (parseFloat(formData.tax_rate) / 100); return { subtotal, tax, total: subtotal + tax }; };
  const { subtotal, tax, total } = calculateTotal();

  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const paged = invoices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const enrichedData = paged.map(inv => ({ ...inv, _onEdit: handleEdit, _onDelete: handleDelete }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoices..." />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100">
            <option value="">All Types</option>
            <option value="invoice">Invoices</option>
            <option value="purchase">Purchases</option>
          </select>
        </div>
        <button onClick={() => { setFormData(defaultForm); setEditingInvoice(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={20} /> Create Invoice
        </button>
      </div>
      <DataTable columns={columns} data={enrichedData} loading={loading} emptyMessage="No invoices found" />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
                <option value="invoice">Invoice</option><option value="purchase">Purchase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact *</label>
              <select value={formData.contact_id} onChange={(e) => setFormData({...formData, contact_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required>
                <option value="">Select contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date *</label>
              <input type="date" value={formData.issue_date} onChange={(e) => setFormData({...formData, issue_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
                <option value="draft">Draft</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items *</label>
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="text" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
                <input type="number" placeholder="Qty" value={item.quantity} min="1" onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
                <input type="number" placeholder="Price" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
                {formData.items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">✕</button>}
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">+ Add item</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#0f172a] p-4 rounded-lg">
            <div className="flex justify-between mb-2"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span><span className="font-medium dark:text-gray-200">€{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-600 dark:text-gray-400">Tax ({formData.tax_rate}%):</span><span className="font-medium dark:text-gray-200">€{tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-[#334155] pt-2 dark:text-gray-100"><span>Total:</span><span>€{total.toFixed(2)}</span></div>
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
