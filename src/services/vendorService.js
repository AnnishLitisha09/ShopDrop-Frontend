import apiClient from '../api/apiClient';

export const vendorService = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/vendor/dashboard');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/vendor/analytics');
    return response.data;
  },

  updateShopStatus: async (isOpen) => {
    const response = await apiClient.patch('/vendor/status', { isOpen });
    return response.data;
  },

  getVendorOrders: async () => {
    const response = await apiClient.get('/vendor/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId, status, rejectionReason = undefined) => {
    const response = await apiClient.patch(`/vendor/orders/${orderId}/status`, { status, rejectionReason });
    return response.data;
  },

  getProducts: async () => {
    const response = await apiClient.get('/vendor/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await apiClient.post('/vendor/products', productData);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await apiClient.put(`/vendor/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await apiClient.delete(`/vendor/products/${productId}`);
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/vendor/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default vendorService;
