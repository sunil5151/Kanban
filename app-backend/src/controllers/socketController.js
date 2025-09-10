// Initialize Socket.IO
export const initSocketIO = (io) => {
  // Middleware for authentication (optional)
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join a board room
    socket.on('join-board', (boardId) => {
      socket.join(`board-${boardId}`);
      console.log(`User ${socket.userId} joined board ${boardId}`);
    });
    
    // Leave a board room
    socket.on('leave-board', (boardId) => {
      socket.leave(`board-${boardId}`);
      console.log(`User ${socket.userId} left board ${boardId}`);
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
  
  return io;
};

// Emit task created event
export const emitTaskCreated = (boardId, task) => {
  global.io.to(`board-${boardId}`).emit('task-created', task);
};

// Emit task updated event
export const emitTaskUpdated = (boardId, task) => {
  global.io.to(`board-${boardId}`).emit('task-updated', task);
};

// Emit task deleted event
export const emitTaskDeleted = (boardId, taskId) => {
  global.io.to(`board-${boardId}`).emit('task-deleted', taskId);
};

// Emit task status changed event
export const emitTaskStatusChanged = (boardId, taskId, oldStatus, newStatus) => {
  global.io.to(`board-${boardId}`).emit('task-status-changed', { taskId, oldStatus, newStatus });
};

// Emit task assigned event
export const emitTaskAssigned = (boardId, taskId, userId, userName) => {
  global.io.to(`board-${boardId}`).emit('task-assigned', { taskId, userId, userName });
};

// Emit conflict detected event
export const emitConflictDetected = (boardId, taskId, conflict) => {
  global.io.to(`board-${boardId}`).emit('conflict-detected', { taskId, conflict });
};

// Emit action logged event
export const emitActionLogged = (boardId, log) => {
  global.io.to(`board-${boardId}`).emit('action-logged', log);
};

// Add these new functions to the socketController.js file

// Emit task locked event
export const emitTaskLocked = (boardId, taskId, userId, userName) => {
  global.io.to(`board-${boardId}`).emit('task-locked', { taskId, userId, userName });
};

// Emit task unlocked event
export const emitTaskUnlocked = (boardId, taskId) => {
  global.io.to(`board-${boardId}`).emit('task-unlocked', { taskId });
};