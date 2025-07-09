import { pool } from '../config/dbConfig.js';
import { emitConflictDetected } from './socketController.js';
import { logAction } from './logController.js';

// Get conflicts for a user
export const getConflicts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { rows: conflicts } = await pool.query(
      `SELECT c.*, t.title as task_title, t.board_id
       FROM task_conflicts c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.user_id = $1 AND c.resolved = false
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    res.json(conflicts);
  } catch (err) {
    console.error('Error fetching conflicts:', err);
    res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
};

// Resolve a conflict
export const resolveConflict = async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { resolution, userId } = req.body;
    
    if (!conflictId || !resolution || !userId) {
      return res.status(400).json({ error: 'Conflict ID, resolution type, and user ID are required' });
    }
    
    // Get the conflict details
    const { rows: conflicts } = await pool.query(
      'SELECT * FROM task_conflicts WHERE id = $1',
      [conflictId]
    );
    
    if (conflicts.length === 0) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    const conflict = conflicts[0];
    
    // Get the current task data
    const { rows: tasks } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [conflict.task_id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Handle the resolution
    if (resolution === 'overwrite') {
      // Use the client version
      const clientVersion = JSON.parse(conflict.client_version);
      
      // Update the task with the client version
      const { rows: updatedTasks } = await pool.query(
        `UPDATE tasks
         SET title = $1, description = $2, status = $3, priority = $4, assigned_user_id = $5, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [clientVersion.title || task.title, 
         clientVersion.description || task.description, 
         clientVersion.status || task.status, 
         clientVersion.priority || task.priority, 
         clientVersion.assigned_user_id || task.assigned_user_id, 
         task.id]
      );
      
      // Log the action
      await logAction(task.id, userId, 'conflict_resolve_overwrite', task, updatedTasks[0]);
      
    } else if (resolution === 'merge') {
      // Merge the server and client versions
      const serverVersion = JSON.parse(conflict.server_version);
      const clientVersion = JSON.parse(conflict.client_version);
      
      // Create a merged version (simple merge strategy)
      const mergedVersion = {
        title: clientVersion.title || serverVersion.title,
        description: clientVersion.description || serverVersion.description,
        status: clientVersion.status || serverVersion.status,
        priority: clientVersion.priority || serverVersion.priority,
        assigned_user_id: clientVersion.assigned_user_id || serverVersion.assigned_user_id
      };
      
      // Update the task with the merged version
      const { rows: updatedTasks } = await pool.query(
        `UPDATE tasks
         SET title = $1, description = $2, status = $3, priority = $4, assigned_user_id = $5, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [mergedVersion.title, mergedVersion.description, mergedVersion.status, mergedVersion.priority, mergedVersion.assigned_user_id, task.id]
      );
      
      // Log the action
      await logAction(task.id, userId, 'conflict_resolve_merge', task, updatedTasks[0]);
    }
    
    // Mark the conflict as resolved
    await pool.query(
      'UPDATE task_conflicts SET resolved = true WHERE id = $1',
      [conflictId]
    );
    
    res.json({ message: 'Conflict resolved successfully' });
  } catch (err) {
    console.error('Error resolving conflict:', err);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
};