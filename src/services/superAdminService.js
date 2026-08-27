import apiClient from '../api/apiClient';

export const superAdminService = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/super-admin/dashboard');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/super-admin/analytics');
    return response.data;
  },

  getInstitutionsList: async () => {
    const response = await apiClient.get('/super-admin/institutions');
    return response.data;
  },

  createInstitution: async (institutionData) => {
    const response = await apiClient.post('/super-admin/institutions', institutionData);
    return response.data;
  },

  updateInstitutionStatus: async (institutionId, status) => {
    const response = await apiClient.patch(`/super-admin/institutions/${institutionId}/status`, { status });
    return response.data;
  },
};

export default superAdminService;
