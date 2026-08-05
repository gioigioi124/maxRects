const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Products
  getProducts: () => request<any[]>('/products'),
  getProduct: (id: string) => request<any>(`/products/${id}`),
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/products/import`, { method: 'POST', body: formData }).then(r => r.json());
  },

  // Orders
  getOrders: () => request<any[]>('/orders'),
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  createOrder: (data: { orderCode: string; items: { productPartId: string; setQuantity: number }[] }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrder: (id: string) => request<any>(`/orders/${id}`, { method: 'DELETE' }),

  // Packing
  runPacking: (orderIds: string[]) =>
    request<any>('/packing/run', { method: 'POST', body: JSON.stringify({ orderIds }) }),
  getBatches: () => request<any[]>('/packing/batches'),
  getBatch: (id: string) => request<any>(`/packing/batches/${id}`),
  getSuggestions: () => request<any[]>('/packing/suggestions'),

  // Print
  getPrintOrderUrl: (id: string) => `${API_BASE}/print/order/${id}`,
  getPrintPartUrl: (partId: string) => `${API_BASE}/print/part/${partId}`,
  getPrintAllPartsUrl: (productId: string) => `${API_BASE}/print/product/${productId}/all-parts`,
  getPrintBatchReportUrl: (batchId: string) => `${API_BASE}/print/batch/${batchId}/report`,
};