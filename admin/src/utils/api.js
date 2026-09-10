// Cut The Queue Admin API Client

export const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    url = import.meta.env.PROD ? 'https://cuthequeue-api.onrender.com' : 'http://localhost:5001';
  }
  return url.replace(/\/+$/, '').replace(/\/api$/, '');
};

export const API_BASE = `${getBaseUrl()}/api`;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cq_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to reach Cut The Queue backend server. Please check internet connection.');
    }
    throw err;
  }
}

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => apiRequest('/auth/me')
};

export const restaurantAPI = {
  getById: (id) => apiRequest(`/restaurants/${id}`),
  update: (id, data) => apiRequest(`/restaurants/${id}/settings`, { method: 'PUT', body: JSON.stringify(data) }),
  getMenu: (id) => apiRequest(`/menu/${id}`),
  addMenuItem: (id, item) => apiRequest(`/menu/${id}/items`, { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id, itemId, item) => apiRequest(`/menu/items/${itemId}`, { method: 'PUT', body: JSON.stringify(item) }),
  toggleMenuItem: (itemId) => apiRequest(`/menu/items/${itemId}/toggle`, { method: 'PATCH' }),
  deleteMenuItem: (id, itemId) => apiRequest(`/menu/items/${itemId}`, { method: 'DELETE' }),
  getOrders: (id) => apiRequest(`/orders/restaurant/${id}`),
  updateOrderStatus: (orderId, status, estimatedPrepMinutes) => 
    apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, estimated_prep_minutes: estimatedPrepMinutes })
    }),
  verifyPickup: (orderNumberOrQr) =>
    apiRequest(`/orders/verify-qr`, {
      method: 'POST',
      body: JSON.stringify({ order_number: orderNumberOrQr, qr_token: orderNumberOrQr })
    }),
  getAnalytics: (id) => apiRequest(`/analytics/restaurant/${id}`)
};
