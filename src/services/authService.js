import apiClient from '../api/apiClient';

export const authService = {
  getInstitutions: async () => {
    const response = await apiClient.get('/auth/institutions');
    return response.data;
  },

  register: async (name, email, password, institutionId) => {
    const response = await apiClient.post('/auth/register', { name, email, password, institutionId });
    return response.data;
  },

  login: async (email, password, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', { email, password, rememberMe });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  seed: async () => {
    const response = await apiClient.post('/auth/seed');
    return response.data;
  },
};

export default authService;
