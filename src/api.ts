import * as store from './data/store';

// ─── Mock API (replaces axios for static deployment) ─────────────────────────

interface MockResponse<T = unknown> {
  data: T;
  status: number;
}

interface MockConfig {
  params?: Record<string, string>;
}

function match(url: string, pattern: string): Record<string, string> | null {
  const parts = pattern.split('/');
  const urlParts = url.split('/');
  if (parts.length !== urlParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(':')) {
      params[parts[i].slice(1)] = urlParts[i];
    } else if (parts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

async function handleGet(url: string, config?: MockConfig): Promise<MockResponse> {
  const params = config?.params || {};
  let m: Record<string, string> | null;

  // Auth
  if (url === '/auth/me') return { data: store.getCurrentUser(), status: 200 };

  // Categories
  if (url === '/categories') return { data: store.getCategories(), status: 200 };

  // Products
  if (url === '/products') return { data: store.getProducts(params), status: 200 };
  m = match(url, '/products/:id');
  if (m) return { data: store.getProduct(Number(m.id)), status: 200 };

  // Inventory
  if (url === '/inventory/stock') return { data: store.getStock(params), status: 200 };
  if (url === '/inventory/alerts') return { data: store.getLowStockAlerts(), status: 200 };

  // Sales
  if (url === '/sales') return { data: store.getSales(params), status: 200 };
  m = match(url, '/sales/:id');
  if (m) return { data: store.getSale(Number(m.id)), status: 200 };

  // Reports
  if (url === '/reports/dashboard') return { data: store.getDashboard(), status: 200 };
  if (url === '/reports/daily-sales') return { data: store.getDailySales(params), status: 200 };
  if (url === '/reports/monthly-sales') return { data: store.getMonthlySales(params), status: 200 };
  if (url === '/reports/product-sales') return { data: store.getProductSales(params), status: 200 };
  if (url === '/reports/stock') return { data: store.getStockReport(params), status: 200 };

  // Users
  if (url === '/users') return { data: store.getUsers(), status: 200 };

  throw { response: { status: 404, data: { error: 'Not found' } } };
}

async function handlePost(url: string, body?: Record<string, unknown>): Promise<MockResponse> {
  let m: Record<string, string> | null;

  // Auth
  if (url === '/auth/login') {
    const result = store.login(body?.email as string, body?.password as string);
    return { data: result, status: 200 };
  }

  // Products
  if (url === '/products') return { data: store.createProduct(body || {}), status: 201 };

  // Inventory
  if (url === '/inventory/adjust') {
    store.adjustStock(body as { product_id: number; quantity_change: number; reason: string });
    return { data: { message: 'Stock adjusted' }, status: 200 };
  }

  // Sales
  if (url === '/sales') {
    const result = store.createSale(body as Parameters<typeof store.createSale>[0]);
    return { data: result, status: 201 };
  }
  m = match(url, '/sales/:id/cancel');
  if (m) {
    store.cancelSale(Number(m.id));
    return { data: { message: 'Bill cancelled' }, status: 200 };
  }

  // Users
  if (url === '/users') return { data: store.createUser(body as Record<string, string>), status: 201 };

  throw { response: { status: 404, data: { error: 'Not found' } } };
}

async function handlePut(url: string, body?: Record<string, unknown>): Promise<MockResponse> {
  let m: Record<string, string> | null;

  // Products
  m = match(url, '/products/:id');
  if (m) return { data: store.updateProduct(Number(m.id), body || {}), status: 200 };

  // Users
  m = match(url, '/users/:id');
  if (m) return { data: store.updateUser(Number(m.id), (body || {}) as Record<string, string>), status: 200 };

  throw { response: { status: 404, data: { error: 'Not found' } } };
}

// ─── Export mock API matching axios interface ────────────────────────────────

const api = {
  get: (url: string, config?: MockConfig) => handleGet(url, config),
  post: (url: string, body?: Record<string, unknown>, config?: MockConfig) => handlePost(url, body),
  put: (url: string, body?: Record<string, unknown>, config?: MockConfig) => handlePut(url, body),
};

export default api;
