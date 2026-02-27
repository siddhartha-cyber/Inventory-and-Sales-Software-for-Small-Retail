import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Package, AlertTriangle, DollarSign, TrendingUp, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-gray-500">Failed to load dashboard data.</p>;

  const cards = [
    { label: 'Total Products', value: data.totalProducts, icon: Package, color: 'bg-blue-500', link: '/products' },
    { label: 'Low Stock Items', value: data.lowStockItems, icon: AlertTriangle, color: 'bg-amber-500', link: '/inventory' },
    { label: "Today's Sales", value: `$${data.todaySales.toFixed(2)}`, icon: DollarSign, color: 'bg-green-500', link: '/sales' },
    { label: 'Monthly Revenue', value: `$${data.monthlySales.toFixed(2)}`, icon: TrendingUp, color: 'bg-indigo-500', link: '/reports' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
            <Link to="/sales" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentSales.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No sales yet today</p>
          ) : (
            <div className="space-y-3">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.bill_number}</p>
                    <p className="text-xs text-gray-500">{sale.cashier_name} &middot; {new Date(sale.sale_date).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${sale.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">All products are well stocked</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku} &middot; {p.category_name || 'Uncategorized'}</p>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${p.stock_qty === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock_qty} / {p.reorder_level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
