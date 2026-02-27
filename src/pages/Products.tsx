import { useState, useEffect, FormEvent } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  category_name: string | null;
  purchase_price: number;
  selling_price: number;
  tax_pct: number;
  stock_qty: number;
  reorder_level: number;
  status: string;
}

interface Category {
  id: number;
  name: string;
  status: string;
}

interface ProductForm {
  name: string;
  category_id: string;
  sku: string;
  purchase_price: string;
  selling_price: string;
  tax_pct: string;
  stock_qty: string;
  reorder_level: string;
}

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({ name: '', category_id: '', sku: '', purchase_price: '', selling_price: '', tax_pct: '', stock_qty: '', reorder_level: '10' });

  const loadProducts = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterCat) params.category_id = filterCat;
    api.get('/products', { params }).then((r) => setProducts(r.data as Product[]));
  };

  useEffect(() => {
    loadProducts();
    api.get('/categories').then((r) => setCategories((r.data as Category[]).filter((c) => c.status === 'active')));
  }, [search, filterCat]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category_id: '', sku: '', purchase_price: '', selling_price: '', tax_pct: '0', stock_qty: '0', reorder_level: '10' });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, category_id: p.category_id ? String(p.category_id) : '', sku: p.sku,
      purchase_price: String(p.purchase_price), selling_price: String(p.selling_price),
      tax_pct: String(p.tax_pct), stock_qty: String(p.stock_qty), reorder_level: String(p.reorder_level)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      tax_pct: Number(form.tax_pct),
      stock_qty: Number(form.stock_qty),
      reorder_level: Number(form.reorder_level),
    };

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      setShowModal(false);
      loadProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Failed to save product');
    }
  };

  const toggleStatus = async (p: Product) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    await api.put(`/products/${p.id}`, { status: newStatus });
    toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    loadProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        {isAdmin && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by name or SKU..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                {isAdmin && <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category_name || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">${p.selling_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stock_qty === 0 ? 'text-red-600' : p.stock_qty <= p.reorder_level ? 'text-amber-600' : 'text-green-600'}`}>
                      {p.stock_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 mr-2" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleStatus(p)} className="text-gray-400 hover:text-gray-600" title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {p.status === 'active' ? <X size={16} /> : <Save size={16} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input type="number" step="0.01" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                  <input type="number" step="0.01" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                  <input type="number" step="0.01" min="0" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
                    <input type="number" min="0" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                  {editing ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
