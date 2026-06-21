import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import StatCard from '../components/StatCard';

const ITEMS_PER_PAGE = 10;

const defaultForm = { name: '', sku: '', description: '', category_id: '', price: '', cost: '', quantity: '', min_quantity: '', unit: 'unit' };

const columns = [
  {
    key: 'name', label: 'Product',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Package size={20} className="text-blue-600 dark:text-blue-400" /></div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{row.category_name}</p>
        </div>
      </div>
    )
  },
  { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-gray-500 dark:text-gray-400">{v}</span> },
  { key: 'price', label: 'Price', render: (v) => `€${parseFloat(v).toFixed(2)}` },
  {
    key: 'quantity', label: 'Stock',
    render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${v <= row.min_quantity ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{v}</span>
        {v <= row.min_quantity && <AlertTriangle size={16} className="text-red-500 dark:text-red-400" />}
      </div>
    )
  },
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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { loadProducts(); }, [search]);

  const loadProducts = async () => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paged = products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/products', formData);
        toast.success('Product created');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData(defaultForm);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, sku: product.sku, description: product.description || '', category_id: product.category_id || '', price: product.price, cost: product.cost, quantity: product.quantity, min_quantity: product.min_quantity, unit: product.unit });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted');
        loadProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const enrichedData = paged.map(p => ({ ...p, _onEdit: handleEdit, _onDelete: handleDelete }));

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Products" value={products.length} icon={Package} color="bg-blue-500" />
        <StatCard title="Low Stock" value={products.filter(p => p.quantity <= p.min_quantity).length} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Total Value" value={`€${products.reduce((s, p) => s + parseFloat(p.price || 0) * parseInt(p.quantity || 0), 0).toLocaleString()}`} icon={Package} color="bg-green-500" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
        <button onClick={() => { setFormData(defaultForm); setEditingProduct(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={20} /> Add Product
        </button>
      </div>
      <DataTable columns={columns} data={enrichedData} loading={loading} emptyMessage="No products found" />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU *</label>
            <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost</label>
              <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Quantity</label>
              <input type="number" value={formData.min_quantity} onChange={(e) => setFormData({...formData, min_quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100" />
            </div>
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
