import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const customerApi = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`)
};

export const followUpApi = {
  getFollowUps: (params) => api.get('/followups', { params }),
  getFollowUpById: (id) => api.get(`/followups/${id}`),
  createFollowUp: (data) => api.post('/followups', data),
  updateFollowUp: (id, data) => api.put(`/followups/${id}`, data),
  deleteFollowUp: (id) => api.delete(`/followups/${id}`)
};

export const callApi = {
  getCalls: (params) => api.get('/calls', { params }),
  getCallById: (id) => api.get(`/calls/${id}`),
  initiateCall: (data) => api.post('/calls/initiate', data)
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard')
};

export default api;
