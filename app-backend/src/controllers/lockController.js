import { pool } from '../config/dbConfig.js';
import { emitTaskLocked, emitTaskUnlocked } from './socketController.js';

// Lock a task for editing
export const lockTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id, user_name } = req.body;
    
    if (!taskId || !user_id || !user_name) {
      return res.status(400).json({ error: 'Task ID, user ID, and user name are required' });
    }
    
    // Check if task exists
    const { rows: tasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task is already locked by someone else
    const { rows: existingLocks } = await pool.query(
      'SELECT l.*, u.name as user_name FROM task_locks l JOIN users u ON l.user_id = u.id WHERE l.task_id = $1',
      [taskId]
    );
    
    if (existingLocks.length > 0) {
      // If locked by the same user, extend the lock
      if (existingLocks[0].user_id === user_id) {
        await pool.query(
          'UPDATE task_locks SET locked_at = CURRENT_TIMESTAMP WHERE task_id = $1 AND user_id = $2',
          [taskId, user_id]
        );
        
        return res.json({
          locked: true,
          owner: true,
          message: 'Lock extended'
        });
      }
      
      // If locked by another user, return error
      return res.status(423).json({
        locked: true,
        owner: false,
        lockedBy: existingLocks[0].user_name,
        lockedAt: existingLocks[0].locked_at,
        message: `Task is currently being edited by ${existingLocks[0].user_name}`
      });
    }
    
    // Lock the task
    await pool.query(
      'INSERT INTO task_locks (task_id, user_id, user_name) VALUES ($1, $2, $3)',
      [taskId, user_id, user_name]
    );
    
    // Emit socket event
    emitTaskLocked(tasks[0].board_id, taskId, user_id, user_name);
    
    res.json({
      locked: true,
      owner: true,
      message: 'Task locked successfully'
    });
  } catch (err) {
    console.error('Error locking task:', err);
    res.status(500).json({ error: 'Failed to lock task' });
  }
};

// Unlock a task
export const unlockTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id } = req.body;
    
    if (!taskId || !user_id) {
      return res.status(400).json({ error: 'Task ID and user ID are required' });
    }
    
    // Check if task exists
    const { rows: tasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task is locked by this user
    const { rows: existingLocks } = await pool.query(
      'SELECT * FROM task_locks WHERE task_id = $1',
      [taskId]
    );
    
    if (existingLocks.length === 0) {
      return res.json({
        locked: false,
        message: 'Task is not locked'
      });
    }
    
    // If locked by another user, return error
    if (existingLocks[0].user_id !== user_id) {
      return res.status(403).json({
        error: 'You cannot unlock a task locked by another user'
      });
    }
    
    // Unlock the task
    await pool.query('DELETE FROM task_locks WHERE task_id = $1', [taskId]);
    
    // Emit socket event
    emitTaskUnlocked(tasks[0].board_id, taskId);
    
    res.json({
      locked: false,
      message: 'Task unlocked successfully'
    });
  } catch (err) {
    console.error('Error unlocking task:', err);
    res.status(500).json({ error: 'Failed to unlock task' });
  }
};

// Check if a task is locked
export const checkTaskLock = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id } = req.query;
    
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }
    
    // Check if task is locked
    const { rows: locks } = await pool.query(
      'SELECT l.*, u.name as user_name FROM task_locks l JOIN users u ON l.user_id = u.id WHERE l.task_id = $1',
      [taskId]
    );
    
    if (locks.length === 0) {
      return res.json({
        locked: false,
        message: 'Task is not locked'
      });
    }
    
    // Check if locked by the requesting user
    const isOwner = user_id && locks[0].user_id === parseInt(user_id);
    
    res.json({
      locked: true,
      owner: isOwner,
      lockedBy: locks[0].user_name,
      lockedAt: locks[0].locked_at,
      message: isOwner ? 'You have locked this task' : `Task is locked by ${locks[0].user_name}`
    });
  } catch (err) {
    console.error('Error checking task lock:', err);
    res.status(500).json({ error: 'Failed to check task lock' });
  }
};

// Clean up expired locks (older than 5 minutes)
export const cleanupExpiredLocks = async () => {
  try {
    const { rows: expiredLocks } = await pool.query(
      "DELETE FROM task_locks WHERE locked_at < NOW() - INTERVAL '5 minutes' RETURNING task_id, user_id"
    );
    
    // Emit unlock events for each expired lock
    for (const lock of expiredLocks) {
      const { rows: tasks } = await pool.query('SELECT board_id FROM tasks WHERE id = $1', [lock.task_id]);
      if (tasks.length > 0) {
        emitTaskUnlocked(tasks[0].board_id, lock.task_id);
      }
    }
    
    return expiredLocks.length;
  } catch (err) {
    console.error('Error cleaning up expired locks:', err);
    return 0;
  }
};