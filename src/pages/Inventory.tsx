import { useState, useEffect, FormEvent, ReactNode } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, PackageX, PackageCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface StockItem {
  id: number;
  name: string;
  sku: string;
  category_name: string | null;
  stock_qty: number;
  reorder_level: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface Category {
  id: number;
  name: string;
  status: string;
}

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showAdjust, setShowAdjust] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity_change: '', reason: '' });

  const loadStock = () => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    if (catFilter) params.category_id = catFilter;
    api.get('/inventory/stock', { params }).then((r) => setStock(r.data as StockItem[]));
  };

  useEffect(() => {
    loadStock();
    api.get('/categories').then((r) => setCategories((r.data as Category[]).filter((c) => c.status === 'active')));
  }, [filter, catFilter]);

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        product_id: showAdjust!.id,
        quantity_change: parseInt(adjustForm.quantity_change),
        reason: adjustForm.reason,
      });
      toast.success('Stock adjusted');
      setShowAdjust(null);
      setAdjustForm({ quantity_change: '', reason: '' });
      loadStock();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Adjustment failed');
    }
  };

  const statusIcon = (s: string): ReactNode => {
    if (s === 'out_of_stock') return <PackageX size={16} className="text-red-500" />;
    if (s === 'low_stock') return <AlertTriangle size={16} className="text-amber-500" />;
    return <PackageCheck size={16} className="text-green-500" />;
  };

  const statusBadge = (s: string): ReactNode => {
    const map: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-700',
      low_stock: 'bg-amber-100 text-amber-700',
      out_of_stock: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{statusIcon(s)} {labels[s]}</span>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Control</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Status</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Current Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Reorder Level</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                {isAdmin && <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stock.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{s.category_name || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{s.stock_qty}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.reorder_level}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(s.stock_status)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setShowAdjust(s); setAdjustForm({ quantity_change: '', reason: '' }); }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {stock.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Adjust Stock: {showAdjust.name}</h2>
              <button onClick={() => setShowAdjust(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Current stock: <strong>{showAdjust.stock_qty}</strong></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Change (+ or -)</label>
                <input type="number" required value={adjustForm.quantity_change}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
                  placeholder="e.g., 10 or -5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input required value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="Reason for adjustment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdjust(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
