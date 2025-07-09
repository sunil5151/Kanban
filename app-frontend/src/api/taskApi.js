import axios from 'axios';
import { API_BASE } from '../config';

const taskApi = {
  // Get all tasks for a board
  getAllTasks: async (boardId) => {
    try {
      const response = await axios.get(`${API_BASE}/tasks/board/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch tasks' };
    }
  },
  
  // Get a specific task
  getTaskById: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch task' };
    }
  },
  
  // Create a new task
  createTask: async (taskData) => {
    try {
      const response = await axios.post(`${API_BASE}/tasks`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create task' };
    }
  },
  
  // Update a task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await axios.put(`${API_BASE}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update task' };
    }
  },
  
  // Delete a task
  deleteTask: async (taskId) => {
    try {
      // Get the current user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id;
      
      const response = await axios.delete(`${API_BASE}/tasks/${taskId}`, {
        data: { user_id: userId } // Send user_id in the request body
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete task' };
    }
  },
  
  // Update task status (for drag-drop)
  updateTaskStatus: async (taskId, status) => {
    try {
      // Get the current user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id;
      
      const response = await axios.patch(`${API_BASE}/tasks/${taskId}/status`, { 
        status, 
        user_id: userId // Add the user_id parameter
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update task status' };
    }
  },
  
  // Assign a task to a user
  assignTask: async (taskId, userId) => {
    try {
      const response = await axios.patch(`${API_BASE}/tasks/${taskId}/assign/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to assign task' };
    }
  },
  
  // Smart assign a task
  smartAssign: async (taskId) => {
    try {
      // Get the current user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id;
      
      const response = await axios.patch(`${API_BASE}/tasks/${taskId}/smart-assign`, {
        user_id: userId // Send user_id in the request body
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to smart assign task' };
    }
  }
};

export default taskApi;