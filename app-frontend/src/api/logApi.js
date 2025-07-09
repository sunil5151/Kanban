import axios from 'axios';
import { API_BASE } from '../config';

const logApi = {
  // Get recent logs
  getRecentLogs: async (boardId) => {
    try {
      let url = `${API_BASE}/logs/recent`;
      if (boardId) url += `?boardId=${boardId}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch logs' };
    }
  }
};

export default logApi;