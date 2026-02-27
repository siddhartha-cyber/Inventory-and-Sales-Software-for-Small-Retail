const STORE_KEY = 'stockmanager_data';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  purchase_price: number;
  selling_price: number;
  tax_pct: number;
  stock_qty: number;
  reorder_level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  type: string;
  quantity_change: number;
  reason: string;
  user_id: number;
  created_at: string;
}

interface SalesBill {
  id: number;
  bill_number: string;
  sale_date: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  discount_type: string;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  user_id: number;
  created_at: string;
}

interface SalesBillItem {
  id: number;
  bill_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_pct: number;
  line_total: number;
}

interface StoreData {
  users: User[];
  categories: Category[];
  products: Product[];
  stockMovements: StockMovement[];
  salesBills: SalesBill[];
  salesBillItems: SalesBillItem[];
  counters: {
    user: number;
    category: number;
    product: number;
    stockMovement: number;
    salesBill: number;
    salesBillItem: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function makeBillNumber(isoDate: string, seq: number): string {
  const d = isoDate.split('T')[0].replace(/-/g, '');
  return `INV-${d}-${String(seq).padStart(4, '0')}`;
}

function nextId(counter: keyof StoreData['counters']): number {
  data.counters[counter] += 1;
  return data.counters[counter];
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function createSeedData(): StoreData {
  const initDate = daysAgo(30);

  const users: User[] = [
    { id: 1, name: 'Admin User', email: 'admin@store.com', password: 'admin123', role: 'admin', status: 'active', created_at: initDate },
    { id: 2, name: 'Sales Staff', email: 'sales@store.com', password: 'sales123', role: 'sales', status: 'active', created_at: initDate },
  ];

  const categories: Category[] = [
    { id: 1, name: 'Electronics', status: 'active', created_at: initDate },
    { id: 2, name: 'Clothing', status: 'active', created_at: initDate },
    { id: 3, name: 'Groceries', status: 'active', created_at: initDate },
    { id: 4, name: 'Beverages', status: 'active', created_at: initDate },
    { id: 5, name: 'Household', status: 'active', created_at: initDate },
    { id: 6, name: 'Stationery', status: 'active', created_at: initDate },
  ];

  const products: Product[] = [
    { id: 1, name: 'Wireless Mouse', sku: 'ELEC-001', category_id: 1, purchase_price: 12.99, selling_price: 24.99, tax_pct: 5, stock_qty: 43, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 2, name: 'USB-C Cable', sku: 'ELEC-002', category_id: 1, purchase_price: 3.50, selling_price: 9.99, tax_pct: 5, stock_qty: 119, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 3, name: 'Bluetooth Speaker', sku: 'ELEC-003', category_id: 1, purchase_price: 25.00, selling_price: 49.99, tax_pct: 5, stock_qty: 7, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 4, name: 'Phone Case', sku: 'ELEC-004', category_id: 1, purchase_price: 2.00, selling_price: 12.99, tax_pct: 5, stock_qty: 0, reorder_level: 15, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 5, name: 'Cotton T-Shirt', sku: 'CLO-001', category_id: 2, purchase_price: 5.00, selling_price: 19.99, tax_pct: 0, stock_qty: 58, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 6, name: 'Denim Jeans', sku: 'CLO-002', category_id: 2, purchase_price: 15.00, selling_price: 39.99, tax_pct: 0, stock_qty: 24, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 7, name: 'Winter Jacket', sku: 'CLO-003', category_id: 2, purchase_price: 30.00, selling_price: 79.99, tax_pct: 0, stock_qty: 4, reorder_level: 8, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 8, name: 'Organic Rice 5kg', sku: 'GRC-001', category_id: 3, purchase_price: 4.00, selling_price: 8.99, tax_pct: 0, stock_qty: 80, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 9, name: 'Olive Oil 1L', sku: 'GRC-002', category_id: 3, purchase_price: 6.00, selling_price: 14.99, tax_pct: 0, stock_qty: 34, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 10, name: 'Whole Wheat Pasta', sku: 'GRC-003', category_id: 3, purchase_price: 1.50, selling_price: 3.99, tax_pct: 0, stock_qty: 0, reorder_level: 25, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 11, name: 'Green Tea Pack', sku: 'BEV-001', category_id: 4, purchase_price: 3.00, selling_price: 7.99, tax_pct: 0, stock_qty: 54, reorder_level: 15, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 12, name: 'Coffee Beans 500g', sku: 'BEV-002', category_id: 4, purchase_price: 8.00, selling_price: 18.99, tax_pct: 5, stock_qty: 10, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 13, name: 'Orange Juice 1L', sku: 'BEV-003', category_id: 4, purchase_price: 2.00, selling_price: 4.99, tax_pct: 0, stock_qty: 40, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 14, name: 'Dish Soap 500ml', sku: 'HSH-001', category_id: 5, purchase_price: 1.50, selling_price: 4.49, tax_pct: 0, stock_qty: 87, reorder_level: 25, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 15, name: 'Paper Towels 6-Pack', sku: 'HSH-002', category_id: 5, purchase_price: 3.00, selling_price: 7.99, tax_pct: 0, stock_qty: 13, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 16, name: 'LED Light Bulb', sku: 'HSH-003', category_id: 5, purchase_price: 1.00, selling_price: 3.99, tax_pct: 5, stock_qty: 199, reorder_level: 30, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 17, name: 'Ballpoint Pen 10-Pack', sku: 'STN-001', category_id: 6, purchase_price: 1.00, selling_price: 4.99, tax_pct: 0, stock_qty: 97, reorder_level: 25, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 18, name: 'A4 Notebook', sku: 'STN-002', category_id: 6, purchase_price: 0.80, selling_price: 2.99, tax_pct: 0, stock_qty: 145, reorder_level: 30, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 19, name: 'Sticky Notes Pack', sku: 'STN-003', category_id: 6, purchase_price: 0.50, selling_price: 1.99, tax_pct: 0, stock_qty: 73, reorder_level: 20, status: 'active', created_at: initDate, updated_at: initDate },
    { id: 20, name: 'Highlighter Set', sku: 'STN-004', category_id: 6, purchase_price: 2.00, selling_price: 5.99, tax_pct: 0, stock_qty: 3, reorder_level: 10, status: 'active', created_at: initDate, updated_at: initDate },
  ];

  // Seed sales bills
  const bill1Date = daysAgo(0, 11, 23);
  const bill2Date = daysAgo(0, 14, 45);
  const bill3Date = daysAgo(1, 10, 15);
  const bill4Date = daysAgo(1, 16, 30);
  const bill5Date = daysAgo(2, 9, 10);
  const bill6Date = daysAgo(2, 13, 20);
  const bill7Date = daysAgo(3, 11, 0);
  const bill8Date = daysAgo(5, 15, 0);

  const salesBills: SalesBill[] = [
    { id: 1, bill_number: makeBillNumber(bill1Date, 1), sale_date: bill1Date, subtotal: 57.96, tax_amount: 0.50, discount: 0, discount_type: 'flat', total: 58.46, payment_method: 'cash', payment_status: 'paid', status: 'completed', user_id: 2, created_at: bill1Date },
    { id: 2, bill_number: makeBillNumber(bill2Date, 2), sale_date: bill2Date, subtotal: 74.98, tax_amount: 3.75, discount: 5, discount_type: 'flat', total: 73.73, payment_method: 'card', payment_status: 'paid', status: 'completed', user_id: 1, created_at: bill2Date },
    { id: 3, bill_number: makeBillNumber(bill3Date, 1), sale_date: bill3Date, subtotal: 54.98, tax_amount: 0, discount: 0, discount_type: 'flat', total: 54.98, payment_method: 'cash', payment_status: 'paid', status: 'completed', user_id: 2, created_at: bill3Date },
    { id: 4, bill_number: makeBillNumber(bill4Date, 2), sale_date: bill4Date, subtotal: 52.95, tax_amount: 1.90, discount: 0, discount_type: 'flat', total: 54.85, payment_method: 'online', payment_status: 'paid', status: 'completed', user_id: 1, created_at: bill4Date },
    { id: 5, bill_number: makeBillNumber(bill5Date, 1), sale_date: bill5Date, subtotal: 18.93, tax_amount: 0, discount: 0, discount_type: 'flat', total: 18.93, payment_method: 'cash', payment_status: 'paid', status: 'completed', user_id: 2, created_at: bill5Date },
    { id: 6, bill_number: makeBillNumber(bill6Date, 2), sale_date: bill6Date, subtotal: 79.99, tax_amount: 0, discount: 8.00, discount_type: 'percentage', total: 71.99, payment_method: 'card', payment_status: 'paid', status: 'completed', user_id: 1, created_at: bill6Date },
    { id: 7, bill_number: makeBillNumber(bill7Date, 1), sale_date: bill7Date, subtotal: 33.44, tax_amount: 0.20, discount: 0, discount_type: 'flat', total: 33.64, payment_method: 'cash', payment_status: 'paid', status: 'completed', user_id: 2, created_at: bill7Date },
    { id: 8, bill_number: makeBillNumber(bill8Date, 1), sale_date: bill8Date, subtotal: 12.99, tax_amount: 0.65, discount: 0, discount_type: 'flat', total: 13.64, payment_method: 'cash', payment_status: 'paid', status: 'cancelled', user_id: 1, created_at: bill8Date },
  ];

  const salesBillItems: SalesBillItem[] = [
    // Bill 1: 2x Cotton T-Shirt + 1x USB-C Cable + 1x Green Tea Pack
    { id: 1, bill_id: 1, product_id: 5, quantity: 2, unit_price: 19.99, tax_pct: 0, line_total: 39.98 },
    { id: 2, bill_id: 1, product_id: 2, quantity: 1, unit_price: 9.99, tax_pct: 5, line_total: 9.99 },
    { id: 3, bill_id: 1, product_id: 11, quantity: 1, unit_price: 7.99, tax_pct: 0, line_total: 7.99 },
    // Bill 2: 1x Wireless Mouse + 1x Bluetooth Speaker
    { id: 4, bill_id: 2, product_id: 1, quantity: 1, unit_price: 24.99, tax_pct: 5, line_total: 24.99 },
    { id: 5, bill_id: 2, product_id: 3, quantity: 1, unit_price: 49.99, tax_pct: 5, line_total: 49.99 },
    // Bill 3: 1x Denim Jeans + 1x Olive Oil
    { id: 6, bill_id: 3, product_id: 6, quantity: 1, unit_price: 39.99, tax_pct: 0, line_total: 39.99 },
    { id: 7, bill_id: 3, product_id: 9, quantity: 1, unit_price: 14.99, tax_pct: 0, line_total: 14.99 },
    // Bill 4: 2x Coffee Beans + 3x Ballpoint Pen
    { id: 8, bill_id: 4, product_id: 12, quantity: 2, unit_price: 18.99, tax_pct: 5, line_total: 37.98 },
    { id: 9, bill_id: 4, product_id: 17, quantity: 3, unit_price: 4.99, tax_pct: 0, line_total: 14.97 },
    // Bill 5: 5x A4 Notebook + 2x Sticky Notes
    { id: 10, bill_id: 5, product_id: 18, quantity: 5, unit_price: 2.99, tax_pct: 0, line_total: 14.95 },
    { id: 11, bill_id: 5, product_id: 19, quantity: 2, unit_price: 1.99, tax_pct: 0, line_total: 3.98 },
    // Bill 6: 1x Winter Jacket
    { id: 12, bill_id: 6, product_id: 7, quantity: 1, unit_price: 79.99, tax_pct: 0, line_total: 79.99 },
    // Bill 7: 3x Dish Soap + 2x Paper Towels + 1x LED Light Bulb
    { id: 13, bill_id: 7, product_id: 14, quantity: 3, unit_price: 4.49, tax_pct: 0, line_total: 13.47 },
    { id: 14, bill_id: 7, product_id: 15, quantity: 2, unit_price: 7.99, tax_pct: 0, line_total: 15.98 },
    { id: 15, bill_id: 7, product_id: 16, quantity: 1, unit_price: 3.99, tax_pct: 5, line_total: 3.99 },
    // Bill 8 (cancelled): 1x Phone Case
    { id: 16, bill_id: 8, product_id: 4, quantity: 1, unit_price: 12.99, tax_pct: 5, line_total: 12.99 },
  ];

  const stockMovements: StockMovement[] = products.map((p, i) => ({
    id: i + 1,
    product_id: p.id,
    type: 'initial',
    quantity_change: p.stock_qty,
    reason: 'Opening stock',
    user_id: 1,
    created_at: initDate,
  }));

  return {
    users,
    categories,
    products,
    stockMovements,
    salesBills,
    salesBillItems,
    counters: {
      user: 2,
      category: 6,
      product: 20,
      stockMovement: 20,
      salesBill: 8,
      salesBillItem: 16,
    },
  };
}

// ─── Store State ─────────────────────────────────────────────────────────────

let data: StoreData = (() => {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return createSeedData();
})();

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  const user = data.users.find(u => u.email === email && u.password === password && u.status === 'active');
  if (!user) throw { response: { status: 401, data: { error: 'Invalid email or password' } } };
  const token = `mock-token-${user.id}`;
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) throw { response: { status: 401, data: { error: 'Not authenticated' } } };
  const userId = parseInt(token.replace('mock-token-', ''));
  const user = data.users.find(u => u.id === userId && u.status === 'active');
  if (!user) throw { response: { status: 401, data: { error: 'Invalid token' } } };
  const { password: _, ...safeUser } = user;
  return safeUser;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function getCategories() {
  return data.categories;
}

// ─── Products ────────────────────────────────────────────────────────────────

function productWithCategory(p: Product) {
  const cat = data.categories.find(c => c.id === p.category_id);
  return { ...p, category_name: cat?.name || null };
}

export function getProducts(params: Record<string, string> = {}) {
  let result = data.products;
  if (params.search) {
    const s = params.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  }
  if (params.category_id) {
    result = result.filter(p => p.category_id === Number(params.category_id));
  }
  if (params.status) {
    result = result.filter(p => p.status === params.status);
  }
  return result.map(productWithCategory);
}

export function getProduct(id: number) {
  const p = data.products.find(p => p.id === id);
  if (!p) throw { response: { status: 404, data: { error: 'Product not found' } } };
  return productWithCategory(p);
}

export function createProduct(payload: Record<string, unknown>) {
  const existing = data.products.find(p => p.sku === payload.sku);
  if (existing) throw { response: { status: 400, data: { error: 'SKU already exists' } } };

  const now = new Date().toISOString();
  const id = nextId('product');
  const product: Product = {
    id,
    name: payload.name as string,
    sku: payload.sku as string,
    category_id: (payload.category_id as number) || null,
    purchase_price: Number(payload.purchase_price) || 0,
    selling_price: Number(payload.selling_price) || 0,
    tax_pct: Number(payload.tax_pct) || 0,
    stock_qty: Number(payload.stock_qty) || 0,
    reorder_level: Number(payload.reorder_level) || 10,
    status: 'active',
    created_at: now,
    updated_at: now,
  };
  data.products.push(product);

  if (product.stock_qty > 0) {
    data.stockMovements.push({
      id: nextId('stockMovement'),
      product_id: id,
      type: 'initial',
      quantity_change: product.stock_qty,
      reason: 'Opening stock',
      user_id: getCurrentUser().id,
      created_at: now,
    });
  }
  save();
  return productWithCategory(product);
}

export function updateProduct(id: number, payload: Record<string, unknown>) {
  const idx = data.products.findIndex(p => p.id === id);
  if (idx === -1) throw { response: { status: 404, data: { error: 'Product not found' } } };

  if (payload.sku && payload.sku !== data.products[idx].sku) {
    const dup = data.products.find(p => p.sku === payload.sku && p.id !== id);
    if (dup) throw { response: { status: 400, data: { error: 'SKU already exists' } } };
  }

  data.products[idx] = {
    ...data.products[idx],
    ...payload,
    id,
    updated_at: new Date().toISOString(),
  } as Product;
  save();
  return productWithCategory(data.products[idx]);
}

// ─── Inventory ───────────────────────────────────────────────────────────────

function stockStatus(p: Product): string {
  if (p.stock_qty === 0) return 'out_of_stock';
  if (p.stock_qty <= p.reorder_level) return 'low_stock';
  return 'in_stock';
}

export function getStock(params: Record<string, string> = {}) {
  let result = data.products.filter(p => p.status === 'active');
  if (params.category_id) {
    result = result.filter(p => p.category_id === Number(params.category_id));
  }
  const mapped = result.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category_name: data.categories.find(c => c.id === p.category_id)?.name || null,
    stock_qty: p.stock_qty,
    reorder_level: p.reorder_level,
    stock_status: stockStatus(p),
  }));
  if (params.status) {
    return mapped.filter(s => s.stock_status === params.status);
  }
  return mapped;
}

export function adjustStock(payload: { product_id: number; quantity_change: number; reason: string }) {
  const idx = data.products.findIndex(p => p.id === payload.product_id);
  if (idx === -1) throw { response: { status: 404, data: { error: 'Product not found' } } };

  const newQty = data.products[idx].stock_qty + payload.quantity_change;
  if (newQty < 0) throw { response: { status: 400, data: { error: 'Stock cannot go below zero' } } };

  data.products[idx].stock_qty = newQty;
  data.products[idx].updated_at = new Date().toISOString();

  data.stockMovements.push({
    id: nextId('stockMovement'),
    product_id: payload.product_id,
    type: 'adjustment',
    quantity_change: payload.quantity_change,
    reason: payload.reason,
    user_id: getCurrentUser().id,
    created_at: new Date().toISOString(),
  });
  save();
}

export function getLowStockAlerts() {
  return data.products
    .filter(p => p.status === 'active' && p.stock_qty <= p.reorder_level)
    .map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_name: data.categories.find(c => c.id === p.category_id)?.name || null,
      stock_qty: p.stock_qty,
      reorder_level: p.reorder_level,
    }))
    .sort((a, b) => a.stock_qty - b.stock_qty)
    .slice(0, 10);
}

// ─── Sales ───────────────────────────────────────────────────────────────────

function billWithCashier(b: SalesBill) {
  const user = data.users.find(u => u.id === b.user_id);
  return { ...b, cashier_name: user?.name || 'Unknown' };
}

export function getSales(params: Record<string, string> = {}) {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 15;
  let bills = [...data.salesBills].sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

  if (params.date) {
    bills = bills.filter(b => b.sale_date.startsWith(params.date));
  }
  if (params.status) {
    bills = bills.filter(b => b.status === params.status);
  }

  const total = bills.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paged = bills.slice(start, start + limit);

  return {
    bills: paged.map(billWithCashier),
    total,
    pages,
  };
}

export function getSale(id: number) {
  const bill = data.salesBills.find(b => b.id === id);
  if (!bill) throw { response: { status: 404, data: { error: 'Bill not found' } } };

  const items = data.salesBillItems
    .filter(i => i.bill_id === id)
    .map(i => {
      const prod = data.products.find(p => p.id === i.product_id);
      return { ...i, product_name: prod?.name || 'Unknown Product' };
    });

  const user = data.users.find(u => u.id === bill.user_id);
  return { ...bill, cashier_name: user?.name || 'Unknown', items };
}

export function createSale(payload: {
  items: Array<{ product_id: number; quantity: number }>;
  payment_method: string;
  payment_status: string;
  discount: number;
  discount_type: string;
}) {
  if (!payload.items || payload.items.length === 0) {
    throw { response: { status: 400, data: { error: 'No items in the bill' } } };
  }

  // Validate stock
  for (const item of payload.items) {
    const prod = data.products.find(p => p.id === item.product_id);
    if (!prod) throw { response: { status: 400, data: { error: `Product not found: ${item.product_id}` } } };
    if (prod.stock_qty < item.quantity) throw { response: { status: 400, data: { error: `Insufficient stock for ${prod.name}` } } };
  }

  const now = new Date().toISOString();
  const billId = nextId('salesBill');

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  const billItems: SalesBillItem[] = [];

  for (const item of payload.items) {
    const prod = data.products.find(p => p.id === item.product_id)!;
    const lineTotal = prod.selling_price * item.quantity;
    const lineTax = lineTotal * prod.tax_pct / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;

    billItems.push({
      id: nextId('salesBillItem'),
      bill_id: billId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: prod.selling_price,
      tax_pct: prod.tax_pct,
      line_total: lineTotal,
    });
  }

  // Calculate discount
  let discountAmount = payload.discount || 0;
  if (payload.discount_type === 'percentage') {
    discountAmount = subtotal * (payload.discount / 100);
  }
  const total = subtotal + taxAmount - discountAmount;

  // Count today's bills for sequence number
  const todayPrefix = todayStr().replace(/-/g, '');
  const todayBillCount = data.salesBills.filter(b => b.bill_number.includes(todayPrefix)).length;
  const billNumber = `INV-${todayPrefix}-${String(todayBillCount + 1).padStart(4, '0')}`;

  const bill: SalesBill = {
    id: billId,
    bill_number: billNumber,
    sale_date: now,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    discount_type: payload.discount_type,
    total: Math.round(total * 100) / 100,
    payment_method: payload.payment_method,
    payment_status: payload.payment_status,
    status: 'completed',
    user_id: getCurrentUser().id,
    created_at: now,
  };

  data.salesBills.push(bill);
  data.salesBillItems.push(...billItems);

  // Deduct stock and log movements
  for (const item of payload.items) {
    const prodIdx = data.products.findIndex(p => p.id === item.product_id);
    data.products[prodIdx].stock_qty -= item.quantity;
    data.products[prodIdx].updated_at = now;

    data.stockMovements.push({
      id: nextId('stockMovement'),
      product_id: item.product_id,
      type: 'sale',
      quantity_change: -item.quantity,
      reason: `Sale: ${billNumber}`,
      user_id: getCurrentUser().id,
      created_at: now,
    });
  }

  save();
  return { id: billId, bill_number: billNumber, total: bill.total };
}

export function cancelSale(id: number) {
  const billIdx = data.salesBills.findIndex(b => b.id === id);
  if (billIdx === -1) throw { response: { status: 404, data: { error: 'Bill not found' } } };
  if (data.salesBills[billIdx].status === 'cancelled') throw { response: { status: 400, data: { error: 'Bill already cancelled' } } };

  data.salesBills[billIdx].status = 'cancelled';
  const now = new Date().toISOString();

  // Reverse stock
  const items = data.salesBillItems.filter(i => i.bill_id === id);
  for (const item of items) {
    const prodIdx = data.products.findIndex(p => p.id === item.product_id);
    if (prodIdx !== -1) {
      data.products[prodIdx].stock_qty += item.quantity;
      data.products[prodIdx].updated_at = now;
      data.stockMovements.push({
        id: nextId('stockMovement'),
        product_id: item.product_id,
        type: 'cancellation',
        quantity_change: item.quantity,
        reason: `Cancelled: ${data.salesBills[billIdx].bill_number}`,
        user_id: getCurrentUser().id,
        created_at: now,
      });
    }
  }
  save();
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function getDashboard() {
  const today = todayStr();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const activeProducts = data.products.filter(p => p.status === 'active');
  const lowStock = activeProducts.filter(p => p.stock_qty > 0 && p.stock_qty <= p.reorder_level);
  const outOfStock = activeProducts.filter(p => p.stock_qty === 0);

  const completedBills = data.salesBills.filter(b => b.status === 'completed');
  const todayBills = completedBills.filter(b => b.sale_date.startsWith(today));
  const monthBills = completedBills.filter(b => b.sale_date >= monthStart);

  const recentSales = completedBills
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .slice(0, 5)
    .map(billWithCashier);

  return {
    totalProducts: activeProducts.length,
    lowStockItems: lowStock.length + outOfStock.length,
    todaySales: todayBills.reduce((s, b) => s + b.total, 0),
    monthlySales: monthBills.reduce((s, b) => s + b.total, 0),
    recentSales,
    lowStockProducts: getLowStockAlerts(),
  };
}

export function getDailySales(params: Record<string, string> = {}) {
  const date = params.date || todayStr();
  const bills = data.salesBills
    .filter(b => b.status === 'completed' && b.sale_date.startsWith(date))
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .map(billWithCashier);

  return {
    date,
    summary: {
      transaction_count: bills.length,
      total_revenue: bills.reduce((s, b) => s + b.total, 0),
      total_tax: bills.reduce((s, b) => s + b.tax_amount, 0),
    },
    bills,
  };
}

export function getMonthlySales(params: Record<string, string> = {}) {
  const now = new Date();
  const month = params.month || String(now.getMonth() + 1).padStart(2, '0');
  const year = params.year || String(now.getFullYear());
  const prefix = `${year}-${month}`;

  const bills = data.salesBills.filter(b => b.status === 'completed' && b.sale_date.startsWith(prefix));

  // Group by day
  const dailyMap = new Map<string, { transactions: number; revenue: number }>();
  for (const b of bills) {
    const day = b.sale_date.split('T')[0];
    const entry = dailyMap.get(day) || { transactions: 0, revenue: 0 };
    entry.transactions++;
    entry.revenue += b.total;
    dailyMap.set(day, entry);
  }

  const dailyTotals = Array.from(dailyMap.entries())
    .map(([date, d]) => ({ date, transactions: d.transactions, revenue: Math.round(d.revenue * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    month: `${year}-${month}`,
    summary: {
      transaction_count: bills.length,
      total_revenue: Math.round(bills.reduce((s, b) => s + b.total, 0) * 100) / 100,
      total_tax: Math.round(bills.reduce((s, b) => s + b.tax_amount, 0) * 100) / 100,
    },
    dailyTotals,
  };
}

export function getProductSales(params: Record<string, string> = {}) {
  const completedBills = data.salesBills.filter(b => b.status === 'completed');
  let relevantBills = completedBills;

  if (params.start_date) {
    relevantBills = relevantBills.filter(b => b.sale_date >= params.start_date);
  }
  if (params.end_date) {
    relevantBills = relevantBills.filter(b => b.sale_date <= params.end_date + 'T23:59:59');
  }

  const billIds = new Set(relevantBills.map(b => b.id));
  const items = data.salesBillItems.filter(i => billIds.has(i.bill_id));

  // Aggregate by product
  const productMap = new Map<number, { units_sold: number; revenue: number }>();
  for (const item of items) {
    const entry = productMap.get(item.product_id) || { units_sold: 0, revenue: 0 };
    entry.units_sold += item.quantity;
    entry.revenue += item.line_total;
    productMap.set(item.product_id, entry);
  }

  let result = Array.from(productMap.entries()).map(([productId, agg]) => {
    const prod = data.products.find(p => p.id === productId);
    const cat = data.categories.find(c => c.id === prod?.category_id);
    return {
      id: productId,
      name: prod?.name || 'Unknown',
      sku: prod?.sku || '',
      category_name: cat?.name || null,
      units_sold: agg.units_sold,
      revenue: Math.round(agg.revenue * 100) / 100,
    };
  });

  if (params.category_id) {
    const catProds = data.products.filter(p => p.category_id === Number(params.category_id)).map(p => p.id);
    result = result.filter(r => catProds.includes(r.id));
  }

  return result.sort((a, b) => b.revenue - a.revenue);
}

export function getStockReport(params: Record<string, string> = {}) {
  let products = data.products.filter(p => p.status === 'active');
  if (params.category_id) {
    products = products.filter(p => p.category_id === Number(params.category_id));
  }
  return products.map(p => {
    const cat = data.categories.find(c => c.id === p.category_id);
    const status = p.stock_qty === 0 ? 'Out of Stock' : p.stock_qty <= p.reorder_level ? 'Low Stock' : 'In Stock';
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_name: cat?.name || null,
      stock_qty: p.stock_qty,
      reorder_level: p.reorder_level,
      stock_status: status,
    };
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUsers() {
  return data.users.map(({ password: _, ...u }) => u);
}

export function createUser(payload: Record<string, string>) {
  const existing = data.users.find(u => u.email === payload.email);
  if (existing) throw { response: { status: 400, data: { error: 'Email already in use' } } };
  if (!payload.password) throw { response: { status: 400, data: { error: 'Password is required' } } };

  const id = nextId('user');
  const user: User = {
    id,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role || 'sales',
    status: 'active',
    created_at: new Date().toISOString(),
  };
  data.users.push(user);
  save();
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function updateUser(id: number, payload: Record<string, string>) {
  const idx = data.users.findIndex(u => u.id === id);
  if (idx === -1) throw { response: { status: 404, data: { error: 'User not found' } } };

  if (payload.email && payload.email !== data.users[idx].email) {
    const dup = data.users.find(u => u.email === payload.email && u.id !== id);
    if (dup) throw { response: { status: 400, data: { error: 'Email already in use' } } };
  }

  const updatedFields: Partial<User> = {};
  if (payload.name !== undefined) updatedFields.name = payload.name;
  if (payload.email !== undefined) updatedFields.email = payload.email;
  if (payload.role !== undefined) updatedFields.role = payload.role;
  if (payload.status !== undefined) updatedFields.status = payload.status;
  if (payload.password) updatedFields.password = payload.password;

  data.users[idx] = { ...data.users[idx], ...updatedFields };
  save();
  const { password: _, ...safeUser } = data.users[idx];
  return safeUser;
}
