import axios from 'axios';
import { API_BASE } from '../config';

const boardApi = {
  // Get all boards
  getAllBoards: async (userId) => {
    try {
      let url = `${API_BASE}/boards`;
      if (userId) url += `?userId=${userId}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch boards' };
    }
  },
  
  // Get a specific board with its tasks
  getBoardById: async (boardId) => {
    try {
      const response = await axios.get(`${API_BASE}/boards/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch board' };
    }
  },
  
  // Create a new board
  createBoard: async (boardData) => {
    try {
      const response = await axios.post(`${API_BASE}/boards`, boardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create board' };
    }
  },
  
  // Update a board
  updateBoard: async (boardId, boardData) => {
    try {
      const response = await axios.put(`${API_BASE}/boards/${boardId}`, boardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update board' };
    }
  },
  
  // Delete a board
  deleteBoard: async (boardId) => {
    try {
      const response = await axios.delete(`${API_BASE}/boards/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete board' };
    }
  }
};

export default boardApi;