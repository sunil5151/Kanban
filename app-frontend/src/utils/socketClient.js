import { io } from 'socket.io-client';

let socket;

// Task locked event
export const onTaskLocked = (callback) => {
  if (!socket) return;
  socket.on('task-locked', callback);
};

// Task unlocked event
export const onTaskUnlocked = (callback) => {
  if (!socket) return;
  socket.on('task-unlocked', callback);
};

export const initSocket = (userId) => {
  if (socket) {
    // If socket exists but is disconnected, reconnect it
    if (socket.disconnected) {
      socket.connect();
    }
    return socket;
  }
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  
  try {
    // Initialize socket connection without namespace
    socket = io(API_BASE, {
      auth: { userId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    return null;
  }
};

// Join a board room
export const joinBoard = (boardId) => {
  if (socket) {
    socket.emit('join-board', boardId);
  }
};

// Leave a board room
export const leaveBoard = (boardId) => {
  if (socket) {
    socket.emit('leave-board', boardId);
  }
};

// Subscribe to task created events
export const onTaskCreated = (callback) => {
  if (socket) {
    socket.on('task-created', callback);
  }
};

// Subscribe to task updated events
export const onTaskUpdated = (callback) => {
  if (socket) {
    socket.on('task-updated', callback);
  }
};

// Subscribe to task deleted events
export const onTaskDeleted = (callback) => {
  if (socket) {
    socket.on('task-deleted', callback);
  }
};

// Subscribe to task status changed events
export const onTaskStatusChanged = (callback) => {
  if (socket) {
    socket.on('task-status-changed', callback);
  }
};

// Subscribe to task assigned events
export const onTaskAssigned = (callback) => {
  if (socket) {
    socket.on('task-assigned', callback);
  }
};

// Subscribe to conflict detected events
export const onConflictDetected = (callback) => {
  if (socket) {
    socket.on('conflict-detected', callback);
  }
};

// Subscribe to action logged events
export const onActionLogged = (callback) => {
  if (socket) {
    socket.on('action-logged', callback);
  }
};

// Clean up function to remove all listeners
export const cleanupSocket = () => {
  if (socket) {
    socket.off('task-created');
    socket.off('task-updated');
    socket.off('task-deleted');
    socket.off('task-status-changed');
    socket.off('task-assigned');
    socket.off('conflict-detected');
    socket.off('action-logged');
    socket.disconnect();
  }
};