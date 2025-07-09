import axios from 'axios';
import { API_BASE } from '../config';

const adminApi = {
  // User management
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch users' };
    }
  },
  
  getUserById: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user details' };
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/users`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create user' };
    }
  },

  // Company management (keeping original function names for compatibility)
  getAllStores: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/stores`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch companies' };
    }
  },
  
  createStore: async (companyData) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/stores`, companyData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create company' };
    }
  },
  
  getStoreByOwnerId: async (ownerId) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/stores/owner/${ownerId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch company details' };
    }
  },
  
  getStoreRatingUsers: async (companyId) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/stores/${companyId}/ratings/users`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch application users' };
    }
  },
};

export default adminApi;