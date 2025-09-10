import { supabase } from '../config/supabaseConfig.js';
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
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (taskError) {
      console.error('Error checking task:', taskError);
      return res.status(500).json({ error: 'Failed to check task' });
    }
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task is already locked by someone else
    const { data: existingLocks, error: lockError } = await supabase
      .from('task_locks')
      .select(`
        *,
        users!user_id(name)
      `)
      .eq('task_id', taskId);
    
    if (lockError) {
      console.error('Error checking existing locks:', lockError);
      return res.status(500).json({ error: 'Failed to check existing locks' });
    }
    
    if (existingLocks.length > 0) {
      const lock = existingLocks[0];
      // If locked by the same user, extend the lock
      if (lock.user_id === user_id) {
        const { error: updateError } = await supabase
          .from('task_locks')
          .update({ locked_at: new Date().toISOString() })
          .eq('task_id', taskId)
          .eq('user_id', user_id);
        
        if (updateError) {
          console.error('Error extending lock:', updateError);
          return res.status(500).json({ error: 'Failed to extend lock' });
        }
        
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
        lockedBy: lock.users ? lock.users.name : 'Unknown user',
        lockedAt: lock.locked_at,
        message: `Task is currently being edited by ${lock.users ? lock.users.name : 'Unknown user'}`
      });
    }
    
    // Lock the task
    const { error: insertError } = await supabase
      .from('task_locks')
      .insert([{ task_id: taskId, user_id, user_name }]);
    
    if (insertError) {
      console.error('Error locking task:', insertError);
      return res.status(500).json({ error: 'Failed to lock task' });
    }
    
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
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (taskError) {
      console.error('Error checking task:', taskError);
      return res.status(500).json({ error: 'Failed to check task' });
    }
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task is locked by this user
    const { data: existingLocks, error: lockError } = await supabase
      .from('task_locks')
      .select('*')
      .eq('task_id', taskId);
    
    if (lockError) {
      console.error('Error checking existing locks:', lockError);
      return res.status(500).json({ error: 'Failed to check existing locks' });
    }
    
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
    const { error: deleteError } = await supabase
      .from('task_locks')
      .delete()
      .eq('task_id', taskId);
    
    if (deleteError) {
      console.error('Error unlocking task:', deleteError);
      return res.status(500).json({ error: 'Failed to unlock task' });
    }
    
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
    const { data: locks, error } = await supabase
      .from('task_locks')
      .select(`
        *,
        users!user_id(name)
      `)
      .eq('task_id', taskId);
    
    if (error) {
      console.error('Error checking task lock:', error);
      return res.status(500).json({ error: 'Failed to check task lock' });
    }
    
    if (locks.length === 0) {
      return res.json({
        locked: false,
        message: 'Task is not locked'
      });
    }
    
    const lock = locks[0];
    // Check if locked by the requesting user
    const isOwner = user_id && lock.user_id === parseInt(user_id);
    
    res.json({
      locked: true,
      owner: isOwner,
      lockedBy: lock.users ? lock.users.name : 'Unknown user',
      lockedAt: lock.locked_at,
      message: isOwner ? 'You have locked this task' : `Task is locked by ${lock.users ? lock.users.name : 'Unknown user'}`
    });
  } catch (err) {
    console.error('Error checking task lock:', err);
    res.status(500).json({ error: 'Failed to check task lock' });
  }
};

// Clean up expired locks (older than 5 minutes)
export const cleanupExpiredLocks = async () => {
  try {
    // First get the expired locks before deleting them
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: expiredLocks, error: fetchError } = await supabase
      .from('task_locks')
      .select('task_id, user_id')
      .lt('locked_at', fiveMinutesAgo);
    
    if (fetchError) {
      console.error('Error fetching expired locks:', fetchError);
      return 0;
    }
    
    if (expiredLocks.length === 0) {
      return 0;
    }
    
    // Delete the expired locks
    const { error: deleteError } = await supabase
      .from('task_locks')
      .delete()
      .lt('locked_at', fiveMinutesAgo);
    
    if (deleteError) {
      console.error('Error deleting expired locks:', deleteError);
      return 0;
    }
    
    // Emit unlock events for each expired lock
    for (const lock of expiredLocks) {
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('board_id')
        .eq('id', lock.task_id);
      
      if (!taskError && tasks.length > 0) {
        emitTaskUnlocked(tasks[0].board_id, lock.task_id);
      }
    }
    
    return expiredLocks.length;
  } catch (err) {
    console.error('Error cleaning up expired locks:', err);
    return 0;
  }
};