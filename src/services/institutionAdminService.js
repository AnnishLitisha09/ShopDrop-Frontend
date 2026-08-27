import apiClient from '../api/apiClient';

export const institutionAdminService = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/institution-admin/dashboard');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/institution-admin/analytics');
    return response.data;
  },

  getVendorApplications: async () => {
    const response = await apiClient.get('/institution-admin/vendor-applications');
    return response.data;
  },

  updateVendorApplicationStatus: async (vendorId, status, rejectionReason = undefined) => {
    const response = await apiClient.patch(`/institution-admin/vendor-applications/${vendorId}/status`, {
      status,
      rejectionReason,
    });
    return response.data;
  },

  getVendorsList: async () => {
    const response = await apiClient.get('/institution-admin/vendors');
    return response.data;
  },

  updateVendorStatus: async (vendorId, status) => {
    const response = await apiClient.patch(`/institution-admin/vendors/${vendorId}/status`, { status });
    return response.data;
  },

  getComplaints: async () => {
    const response = await apiClient.get('/institution-admin/complaints');
    return response.data;
  },

  updateComplaintStatus: async (complaintId, status, resolutionNotes = undefined) => {
    const response = await apiClient.patch(`/institution-admin/complaints/${complaintId}/status`, {
      status,
      resolutionNotes,
    });
    return response.data;
  },

  getStudents: async (params = {}) => {
    const response = await apiClient.get('/institution-admin/students', { params });
    return response.data;
  },

  getStudentDetails: async (studentId) => {
    const response = await apiClient.get(`/institution-admin/students/${studentId}`);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await apiClient.post('/institution-admin/students', studentData);
    return response.data;
  },

  updateStudent: async (studentId, studentData) => {
    const response = await apiClient.put(`/institution-admin/students/${studentId}`, studentData);
    return response.data;
  },

  updateStudentStatus: async (studentId, status) => {
    const response = await apiClient.patch(`/institution-admin/students/${studentId}/status`, { status });
    return response.data;
  },
};

export default institutionAdminService;
