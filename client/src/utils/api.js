// Centralized API client with JWT authentication and friendly error messaging

export const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || !url.trim()) {
    url = import.meta.env.PROD ? 'https://cuthequeue-api.onrender.com' : 'http://localhost:5001';
  }
  return url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
};

export const API_BASE = `${getBaseUrl()}/api`;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cq_token');
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
      const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.code = data.code || (response.status === 409 ? 'ACCOUNT_EXISTS' : response.status === 401 ? 'UNAUTHORIZED' : response.status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR');
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message && err.message.includes('fetch')) {
      const netErr = new Error('Unable to connect to the server. Please try again.');
      netErr.code = 'NETWORK_ERROR';
      netErr.status = 0;
      throw netErr;
    }
    throw err;
  }
}

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  me: () => apiRequest('/auth/me'),
  updateProfile: (profile) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  resetPassword: (data) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getDemoUsers: () => apiRequest('/auth/demo-users')
};

export const restaurantAPI = {
  getAll: async (params = {}) => {
    const cleanParams = {};
    if (params.search || params.q) {
      const q = (params.q || params.search).trim();
      if (q) {
        cleanParams.q = q;
        cleanParams.search = q;
      }
    }
    if (params.cuisine || params.category) {
      const c = params.category || params.cuisine;
      if (c && c !== 'All') {
        cleanParams.category = c;
        cleanParams.cuisine = c;
      }
    }
    if (params.location && params.location !== 'All') {
      cleanParams.location = params.location;
    }
    if (params.area && params.area !== 'All') {
      cleanParams.area = params.area;
    }
    if (params.brand && params.brand !== 'All') {
      cleanParams.brand = params.brand;
    }
    if (params.open_only || params.openNow) {
      cleanParams.openNow = 'true';
      cleanParams.open_only = 'true';
    }
    if (params.lat) cleanParams.lat = params.lat;
    if (params.lng) cleanParams.lng = params.lng;

    const query = new URLSearchParams(cleanParams).toString();
    return apiRequest(`/restaurants${query ? `?${query}` : ''}`);
  },
  getBrands: () => apiRequest('/restaurants/brands'),
  getBrand: (idOrSlug) => apiRequest(`/restaurants/brands/${idOrSlug}`),
  getById: (id) => apiRequest(`/restaurants/${id}`),
  updateSettings: (id, settings) => apiRequest(`/restaurants/${id}/settings`, { method: 'PUT', body: JSON.stringify(settings) }),
  toggleStatus: (id) => apiRequest(`/restaurants/${id}/toggle-status`, { method: 'PATCH' })
};

export const menuAPI = {
  getByRestaurant: (restaurantId) => apiRequest(`/menu/${restaurantId}`),
  addItem: (restaurantId, item) => apiRequest(`/menu/${restaurantId}/items`, { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) => apiRequest(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  toggleAvailability: (id) => apiRequest(`/menu/items/${id}/availability`, { method: 'PATCH' }),
  deleteItem: (id) => apiRequest(`/menu/items/${id}`, { method: 'DELETE' }),
  addCategory: (restaurantId, category) => apiRequest(`/menu/${restaurantId}/categories`, { method: 'POST', body: JSON.stringify(category) })
};

export const orderAPI = {
  createOrder: (orderData) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getMyOrders: () => apiRequest('/orders/my-orders'),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  getRestaurantOrders: (restaurantId) => apiRequest(`/orders/restaurant/${restaurantId}`),
  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  verifyQR: (data) => apiRequest('/orders/verify-qr', { method: 'POST', body: JSON.stringify(data) })
};

export const paymentAPI = {
  process: (data) => apiRequest('/payments/process', { method: 'POST', body: JSON.stringify(data) }),
  refund: (orderId) => apiRequest('/payments/refund', { method: 'POST', body: JSON.stringify({ order_id: orderId }) })
};

export const analyticsAPI = {
  getRestaurantAnalytics: (restaurantId) => apiRequest(`/analytics/restaurant/${restaurantId}`)
};

export const superAdminAPI = {
  getOverview: () => apiRequest('/superadmin/overview'),
  getRestaurants: () => apiRequest('/superadmin/restaurants'),
  updateRestaurantStatus: (id, statusData) => apiRequest(`/superadmin/restaurants/${id}/status`, { method: 'PATCH', body: JSON.stringify(statusData) }),
  getUsers: () => apiRequest('/superadmin/users'),
  toggleUserSuspend: (id) => apiRequest(`/superadmin/users/${id}/toggle-suspend`, { method: 'PATCH' }),
  getAllOrders: () => apiRequest('/superadmin/orders')
};

export const showcaseAPI = {
  getActive: () => apiRequest('/showcases')
};

