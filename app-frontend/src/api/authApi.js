import axios from 'axios';
import { API_BASE } from '../config';

const authApi = {
  registerUser: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },
  
  loginUser: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },
  
  updatePassword: async ({ userId, oldPassword, newPassword }) => {
    try {
      const response = await axios.put(
        `${API_BASE}/auth/password`,
        { userId, oldPassword, newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Password update failed' };
    }
  },
  
  uploadProfileImage: async ({ userId, imageBase64 }) => {
    try {
      const response = await axios.post(
        `${API_BASE}/auth/profile-image`,
        { userId, imageBase64 },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Image upload failed' };
    }
  },
  
  getUserProfile: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/auth/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get user profile' };
    }
  }
};

export default authApi;