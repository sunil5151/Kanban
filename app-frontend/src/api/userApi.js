import axios from 'axios';
import { API_BASE } from '../config';

const userApi = {
  fetchStores: async ({ userId, name, address }) => {
    try {
      // Build query string
      let url = `${API_BASE}/user/stores?userId=${userId}`;
      if (name) url += `&name=${encodeURIComponent(name)}`;
      if (address) url += `&address=${encodeURIComponent(address)}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch companies' };
    }
  },
  
  submitRating: async ({ userId, storeId, rating, proposal }) => {
    try {
      const response = await axios.post(`${API_BASE}/user/stores/${storeId}/rate`, {
        userId,
        rating,
        proposal
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }
};

export default userApi;