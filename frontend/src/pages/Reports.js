import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const tooltipStyle = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' };

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financial');
  const [financial, setFinancial] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadReports();
  }, [activeTab, period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'financial') {
        const res = await api.get('/reports/financial');
        setFinancial(res.data);
      } else if (activeTab === 'inventory') {
        const res = await api.get('/reports/inventory');
        setInventory(res.data);
      } else if (activeTab === 'sales') {
        const res = await api.get(`/reports/sales?period=${period}`);
        setSales(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-gray-100">Reports</h1>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 dark:text-gray-400">Loading...</div>
      ) : (
        <>
          {activeTab === 'financial' && financial && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{financial.summary.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Collected</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">€{financial.summary.collected.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">€{financial.summary.pending.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Expenses</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">€{financial.summary.expenses.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Profit</p>
                  <p className={`text-2xl font-bold ${financial.summary.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    €{financial.summary.profit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Monthly Revenue vs Purchases</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financial.monthly.map(m => ({
                    month: new Date(m.month).toLocaleDateString('en-US', { month: 'short' }),
                    revenue: parseFloat(m.revenue) || 0,
                    purchases: parseFloat(m.purchases) || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(v) => `€${v.toLocaleString()}`} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="purchases" fill="#EF4444" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && inventory && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold dark:text-gray-100">{inventory.summary.total_products}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Stock Value</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">€{inventory.summary.total_stock_value.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inventory.summary.low_stock_count}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Low Stock Value</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">€{inventory.summary.low_stock_value.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Stock by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={inventory.by_category.map(c => ({
                          name: c.category || 'Uncategorized',
                          value: parseFloat(c.stock_value) || 0
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventory.by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `€${v.toLocaleString()}`} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Low Stock Alert</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {inventory.low_stock_products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                          <p className="font-medium dark:text-gray-200">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 dark:text-red-400">{product.quantity} left</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Min: {product.min_quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && sales && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100"
                >
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last 12 Months</option>
                </select>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Daily Sales</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sales.daily_sales.map(d => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    orders: parseInt(d.orders),
                    revenue: parseFloat(d.revenue)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#94a3b8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue (€)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Top Products</h3>
                  <div className="space-y-3">
                    {sales.top_products.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                        <div>
                          <p className="font-medium dark:text-gray-200">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.units_sold} units sold</p>
                        </div>
                        <p className="font-bold dark:text-gray-100">€{parseFloat(product.revenue).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Top Customers</h3>
                  <div className="space-y-3">
                    {sales.top_customers.map((customer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                        <div>
                          <p className="font-medium dark:text-gray-200">{customer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.orders} orders</p>
                        </div>
                        <p className="font-bold dark:text-gray-100">€{parseFloat(customer.total_spent).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
