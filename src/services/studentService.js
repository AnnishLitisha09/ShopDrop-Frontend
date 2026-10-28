import apiClient from '../api/apiClient';

export const studentService = {
  getHomeData: async () => {
    const response = await apiClient.get('/student/home');
    return response.data;
  },

  getVendorDetails: async (vendorId) => {
    const response = await apiClient.get(`/student/vendors/${vendorId}`);
    return response.data;
  },

  getProductDetails: async (productId) => {
    const response = await apiClient.get(`/student/products/${productId}`);
    return response.data;
  },

  createPaymentOrder: async (payload) => {
    const response = await apiClient.post('/student/payment/create-order', payload);
    return response.data;
  },

  createOrder: async (orderPayload) => {
    const response = await apiClient.post('/student/orders', orderPayload);
    return response.data;
  },

  cancelOrder: async (orderId, reason = '') => {
    const response = await apiClient.post(`/student/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  getOrders: async () => {
    const response = await apiClient.get('/student/orders');
    return response.data;
  },

  getOrderDetails: async (orderId) => {
    const response = await apiClient.get(`/student/orders/${orderId}`);
    return response.data;
  },

  submitReview: async (reviewPayload) => {
    const response = await apiClient.post('/student/reviews', reviewPayload);
    return response.data;
  },

  submitComplaint: async (complaintPayload) => {
    const response = await apiClient.post('/student/complaints', complaintPayload);
    return response.data;
  },

  getComplaints: async () => {
    const response = await apiClient.get('/student/complaints');
    return response.data;
  },

  searchMarketplace: async (query = '', category = 'All') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category && category !== 'All') params.append('category', category);

    const response = await apiClient.get(`/student/search?${params.toString()}`);
    return response.data;
  },
};

export default studentService;
