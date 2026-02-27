import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileText, XCircle, Download, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Bill {
  id: number;
  bill_number: string;
  sale_date: string;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  cashier_name: string;
}

interface BillDetail extends Bill {
  subtotal: number;
  tax_amount: number;
  discount: number;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

interface SearchProduct {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  tax_pct: number;
  stock_qty: number;
}

interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  tax_pct: number;
  quantity: number;
  max_qty: number;
}

interface PaymentState {
  method: string;
  status: string;
  discount: string;
  discount_type: string;
}

function generateReceiptHTML(bill: BillDetail): string {
  const itemRows = bill.items.map(it =>
    `<tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${it.product_name}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${it.quantity}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">$${it.unit_price.toFixed(2)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">$${it.line_total.toFixed(2)}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><title>Receipt - ${bill.bill_number}</title>
<style>body{font-family:monospace;max-width:400px;margin:40px auto;padding:20px;font-size:13px}
h2{text-align:center;margin:0 0 4px}p.sub{text-align:center;color:#666;margin:0 0 16px}
hr{border:none;border-top:1px dashed #ccc;margin:12px 0}
table{width:100%;border-collapse:collapse}th{text-align:left;padding:4px 8px;border-bottom:2px solid #333}
.right{text-align:right}.total{font-size:16px;font-weight:bold}
@media print{body{margin:0;padding:10px}}</style></head>
<body>
<h2>StockManager</h2>
<p class="sub">Inventory & Sales Management</p>
<hr>
<p><strong>Bill:</strong> ${bill.bill_number}<br>
<strong>Date:</strong> ${new Date(bill.sale_date).toLocaleString()}<br>
<strong>Cashier:</strong> ${bill.cashier_name}<br>
<strong>Payment:</strong> ${bill.payment_method} (${bill.payment_status})</p>
<hr>
<table>
<thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead>
<tbody>${itemRows}</tbody>
</table>
<hr>
<p>Subtotal: <span style="float:right">$${bill.subtotal.toFixed(2)}</span></p>
<p>Tax: <span style="float:right">$${bill.tax_amount.toFixed(2)}</span></p>
${bill.discount > 0 ? `<p>Discount: <span style="float:right">-$${bill.discount.toFixed(2)}</span></p>` : ''}
<hr>
<p class="total">TOTAL: <span style="float:right">$${bill.total.toFixed(2)}</span></p>
<hr>
<p style="text-align:center;color:#888;font-size:11px">Thank you for your purchase!</p>
<script>window.print()</script>
</body></html>`;
}

export default function Sales() {
  const { isAdmin } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<BillDetail | null>(null);

  // New sale state
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentState>({ method: 'cash', status: 'paid', discount: '', discount_type: 'flat' });

  const loadBills = () => {
    api.get('/sales', { params: { page: String(page), limit: '15' } }).then((r) => {
      const d = r.data as { bills: Bill[]; total: number; pages: number };
      setBills(d.bills);
      setTotal(d.total);
      setPages(d.pages);
    });
  };

  useEffect(() => { loadBills(); }, [page]);

  const searchProducts = () => {
    api.get('/products', { params: { search: productSearch, status: 'active' } }).then((r) => setProducts(r.data as SearchProduct[]));
  };

  useEffect(() => {
    if (showNew && productSearch) {
      const timer = setTimeout(searchProducts, 300);
      return () => clearTimeout(timer);
    }
  }, [productSearch, showNew]);

  const addToCart = (product: SearchProduct) => {
    if (product.stock_qty <= 0) return toast.error('Product is out of stock');
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_qty) return toast.error('Not enough stock');
      setCart(cart.map((c) => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        product_id: product.id, name: product.name, sku: product.sku,
        unit_price: product.selling_price, tax_pct: product.tax_pct,
        quantity: 1, max_qty: product.stock_qty
      }]);
    }
    setProductSearch('');
    setProducts([]);
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    if (qty > cart[idx].max_qty) return toast.error('Exceeds available stock');
    setCart(cart.map((c, i) => i === idx ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (idx: number) => setCart(cart.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const taxTotal = cart.reduce((s, c) => s + (c.unit_price * c.quantity * c.tax_pct / 100), 0);
  const discountAmt = payment.discount_type === 'percentage'
    ? subtotal * (parseFloat(payment.discount) || 0) / 100
    : (parseFloat(payment.discount) || 0);
  const grandTotal = subtotal + taxTotal - discountAmt;

  const submitSale = async () => {
    if (cart.length === 0) return toast.error('Add items to the bill');
    try {
      const res = await api.post('/sales', {
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: payment.method,
        payment_status: payment.status,
        discount: parseFloat(payment.discount) || 0,
        discount_type: payment.discount_type,
      });
      const data = res.data as { bill_number: string };
      toast.success(`Bill ${data.bill_number} created`);
      setShowNew(false);
      setCart([]);
      setPayment({ method: 'cash', status: 'paid', discount: '', discount_type: 'flat' });
      loadBills();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Sale failed');
    }
  };

  const viewBill = async (id: number) => {
    const res = await api.get(`/sales/${id}`);
    setShowDetail(res.data as BillDetail);
  };

  const cancelBill = async (id: number) => {
    if (!confirm('Cancel this bill? Stock will be reversed.')) return;
    try {
      await api.post(`/sales/${id}/cancel`);
      toast.success('Bill cancelled');
      setShowDetail(null);
      loadBills();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Cancellation failed');
    }
  };

  const downloadReceipt = async (billId: number) => {
    try {
      const res = await api.get(`/sales/${billId}`);
      const bill = res.data as BillDetail;
      const html = generateReceiptHTML(bill);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Failed to generate receipt');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales & Billing</h1>
        <button onClick={() => { setShowNew(true); setCart([]); setProducts([]); setProductSearch(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          <Plus size={18} /> New Sale
        </button>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bill #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Payment</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cashier</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.bill_number}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(b.sale_date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">${b.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center capitalize">{b.payment_method}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.cashier_name}</td>
                  <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                    <button onClick={() => viewBill(b.id)} className="text-indigo-600 hover:text-indigo-800" title="View"><FileText size={16} /></button>
                    <button onClick={() => downloadReceipt(b.id)} className="text-gray-500 hover:text-gray-700" title="Receipt"><Download size={16} /></button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No sales recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">{total} total records</span>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">New Sale</h2>
              <button onClick={() => setShowNew(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search products by name or SKU..." value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                {products.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {products.map((p) => (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center text-sm">
                        <span>{p.name} <span className="text-gray-400">({p.sku})</span></span>
                        <span className="text-gray-500">${p.selling_price.toFixed(2)} &middot; Qty: {p.stock_qty}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-600">Product</th>
                      <th className="text-right py-2 font-medium text-gray-600 w-20">Price</th>
                      <th className="text-center py-2 font-medium text-gray-600 w-24">Qty</th>
                      <th className="text-right py-2 font-medium text-gray-600 w-24">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2">{c.name}<br /><span className="text-xs text-gray-400">{c.sku}</span></td>
                        <td className="py-2 text-right">${c.unit_price.toFixed(2)}</td>
                        <td className="py-2 text-center">
                          <input type="number" min="1" max={c.max_qty} value={c.quantity}
                            onChange={(e) => updateQty(i, parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" />
                        </td>
                        <td className="py-2 text-right font-medium">${(c.unit_price * c.quantity).toFixed(2)}</td>
                        <td className="py-2"><button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Payment & Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select value={payment.status} onChange={(e) => setPayment({ ...payment, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                      <input type="number" min="0" step="0.01" value={payment.discount}
                        onChange={(e) => setPayment({ ...payment, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" />
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={payment.discount_type} onChange={(e) => setPayment({ ...payment, discount_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="flat">Flat ($)</option>
                        <option value="percentage">Percent (%)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-medium">${taxTotal.toFixed(2)}</span></div>
                  {discountAmt > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-medium text-red-600">-${discountAmt.toFixed(2)}</span></div>}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={submitSale} disabled={cart.length === 0}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Bill: {showDetail.bill_number}</h2>
              <button onClick={() => setShowDetail(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-500">Date:</p><p>{new Date(showDetail.sale_date).toLocaleString()}</p>
                <p className="text-gray-500">Cashier:</p><p>{showDetail.cashier_name}</p>
                <p className="text-gray-500">Payment:</p><p className="capitalize">{showDetail.payment_method} ({showDetail.payment_status})</p>
                <p className="text-gray-500">Status:</p>
                <p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${showDetail.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{showDetail.status}</span></p>
              </div>

              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Product</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
                <tbody>
                  {showDetail.items?.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2">{it.product_name}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right">${it.unit_price.toFixed(2)}</td>
                      <td className="py-2 text-right">${it.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${showDetail.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${showDetail.tax_amount.toFixed(2)}</span></div>
                {showDetail.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-600">-${showDetail.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>${showDetail.total.toFixed(2)}</span></div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => downloadReceipt(showDetail.id)} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download size={16} /> Receipt PDF
                </button>
                {isAdmin && showDetail.status === 'completed' && (
                  <button onClick={() => cancelBill(showDetail.id)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <XCircle size={16} /> Cancel Bill
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
