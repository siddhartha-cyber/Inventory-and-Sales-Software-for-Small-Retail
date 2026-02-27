import { useState, useEffect } from 'react';
import api from '../api';
import { Download, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.filter(c => c.status === 'active')));
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      switch (activeTab) {
        case 'daily':
          res = await api.get('/reports/daily-sales', { params: { date } });
          break;
        case 'monthly':
          res = await api.get('/reports/monthly-sales', { params: { month, year } });
          break;
        case 'product':
          res = await api.get('/reports/product-sales', { params: { start_date: startDate, end_date: endDate, category_id: catFilter || undefined } });
          break;
        case 'stock':
          res = await api.get('/reports/stock', { params: { category_id: catFilter || undefined } });
          break;
      }
      setReportData(res.data);
    } catch {
      toast.error('Failed to load report');
    }
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [activeTab]);

  const exportReport = (format) => {
    const token = localStorage.getItem('token');
    let url = '';
    switch (activeTab) {
      case 'daily':
        url = `/api/export/daily-sales?date=${date}&format=${format}`;
        break;
      case 'stock':
        url = `/api/export/stock?format=${format}`;
        break;
      case 'product':
        url = `/api/export/product-sales?start_date=${startDate}&end_date=${endDate}&format=${format}`;
        break;
      default:
        toast.error('Export not available for this report');
        return;
    }
    window.open(`${url}&token=${token}`, '_blank');
  };

  const tabs = [
    { id: 'daily', label: 'Daily Sales' },
    { id: 'monthly', label: 'Monthly Sales' },
    { id: 'product', label: 'Product Sales' },
    { id: 'stock', label: 'Stock Report' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setReportData(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === tab.id ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          {activeTab === 'daily' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
          {activeTab === 'monthly' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={String(i + 1).padStart(2, '0')}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </>
          )}
          {activeTab === 'product' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </>
          )}
          {(activeTab === 'product' || activeTab === 'stock') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">All</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={loadReport} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <Filter size={16} className="inline mr-1" /> Generate
          </button>
          {['daily', 'stock', 'product'].includes(activeTab) && (
            <div className="flex gap-1 ml-auto">
              <button onClick={() => exportReport('xlsx')} className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-1">
                <Download size={14} /> Excel
              </button>
              <button onClick={() => exportReport('csv')} className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-1">
                <Download size={14} /> CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : reportData && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeTab === 'daily' && <DailySalesReport data={reportData} />}
          {activeTab === 'monthly' && <MonthlySalesReport data={reportData} />}
          {activeTab === 'product' && <ProductSalesReport data={reportData} />}
          {activeTab === 'stock' && <StockReport data={reportData} />}
        </div>
      )}
    </div>
  );
}

function DailySalesReport({ data }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
        <div><p className="text-xs text-gray-500">Date</p><p className="font-semibold">{data.date}</p></div>
        <div><p className="text-xs text-gray-500">Transactions</p><p className="font-semibold">{data.summary.transaction_count}</p></div>
        <div><p className="text-xs text-gray-500">Revenue</p><p className="font-semibold">${data.summary.total_revenue.toFixed(2)}</p></div>
        <div><p className="text-xs text-gray-500">Tax Collected</p><p className="font-semibold">${data.summary.total_tax.toFixed(2)}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-2">Bill #</th><th className="text-left px-4 py-2">Time</th>
            <th className="text-right px-4 py-2">Total</th><th className="text-center px-4 py-2">Payment</th><th className="text-left px-4 py-2">Cashier</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.bills.map((b) => (
              <tr key={b.id}><td className="px-4 py-2">{b.bill_number}</td><td className="px-4 py-2">{new Date(b.sale_date).toLocaleTimeString()}</td>
                <td className="px-4 py-2 text-right font-medium">${b.total.toFixed(2)}</td><td className="px-4 py-2 text-center capitalize">{b.payment_method}</td>
                <td className="px-4 py-2">{b.cashier_name}</td></tr>
            ))}
            {data.bills.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No sales on this date</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlySalesReport({ data }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
        <div><p className="text-xs text-gray-500">Month</p><p className="font-semibold">{data.month}</p></div>
        <div><p className="text-xs text-gray-500">Transactions</p><p className="font-semibold">{data.summary.transaction_count}</p></div>
        <div><p className="text-xs text-gray-500">Revenue</p><p className="font-semibold">${data.summary.total_revenue.toFixed(2)}</p></div>
        <div><p className="text-xs text-gray-500">Tax Collected</p><p className="font-semibold">${data.summary.total_tax.toFixed(2)}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-2">Date</th><th className="text-right px-4 py-2">Transactions</th><th className="text-right px-4 py-2">Revenue</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.dailyTotals.map((d, i) => (
              <tr key={i}><td className="px-4 py-2">{d.date}</td>
                <td className="px-4 py-2 text-right">{d.transactions}</td>
                <td className="px-4 py-2 text-right font-medium">${d.revenue.toFixed(2)}</td></tr>
            ))}
            {data.dailyTotals.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No sales this month</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductSalesReport({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b"><tr>
          <th className="text-left px-4 py-2">Product</th><th className="text-left px-4 py-2">SKU</th>
          <th className="text-left px-4 py-2">Category</th><th className="text-right px-4 py-2">Units Sold</th><th className="text-right px-4 py-2">Revenue</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((p) => (
            <tr key={p.id}><td className="px-4 py-2 font-medium">{p.name}</td><td className="px-4 py-2 text-gray-500">{p.sku}</td>
              <td className="px-4 py-2 text-gray-500">{p.category_name || '-'}</td>
              <td className="px-4 py-2 text-right">{p.units_sold}</td><td className="px-4 py-2 text-right font-medium">${p.revenue.toFixed(2)}</td></tr>
          ))}
          {data.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No product sales data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function StockReport({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b"><tr>
          <th className="text-left px-4 py-2">Product</th><th className="text-left px-4 py-2">SKU</th>
          <th className="text-left px-4 py-2">Category</th><th className="text-right px-4 py-2">Stock</th>
          <th className="text-right px-4 py-2">Reorder Lvl</th><th className="text-center px-4 py-2">Status</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((p) => (
            <tr key={p.id}><td className="px-4 py-2 font-medium">{p.name}</td><td className="px-4 py-2 text-gray-500">{p.sku}</td>
              <td className="px-4 py-2 text-gray-500">{p.category_name || '-'}</td>
              <td className="px-4 py-2 text-right font-semibold">{p.stock_qty}</td>
              <td className="px-4 py-2 text-right">{p.reorder_level}</td>
              <td className="px-4 py-2 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  p.stock_status === 'In Stock' ? 'bg-green-100 text-green-700' :
                  p.stock_status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>{p.stock_status}</span>
              </td></tr>
          ))}
          {data.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No stock data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
