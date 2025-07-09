import axios from 'axios';
import { API_BASE } from '../config';

const conflictApi = {
  // Get conflicts for a user
  getConflicts: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/conflicts/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch conflicts' };
    }
  },
  
  // Resolve a conflict
  resolveConflict: async (conflictId, resolution, userId) => {
    try {
      const response = await axios.post(`${API_BASE}/conflicts/${conflictId}/resolve`, {
        resolution,
        userId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to resolve conflict' };
    }
  }
};

export default conflictApi;