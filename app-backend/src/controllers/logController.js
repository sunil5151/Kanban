import { pool } from '../config/dbConfig.js';
import { emitActionLogged } from './socketController.js';

// Get recent logs (20 most recent)
export const getRecentLogs = async (req, res) => {
  try {
    const { boardId } = req.query;
    
    let query = `
      SELECT l.*, t.title as task_title, t.board_id, u.name as user_name
      FROM action_logs l
      JOIN tasks t ON l.task_id = t.id
      JOIN users u ON l.user_id = u.id
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (boardId) {
      query += ` WHERE t.board_id = $${paramIndex++}`;
      queryParams.push(boardId);
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT 20`;
    
    const { rows: logs } = await pool.query(query, queryParams);
    
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Log an action (internal function)
export const logAction = async (taskId, userId, actionType, previousValue, newValue) => {
  try {
    // Get the board ID for the task
    const { rows: tasks } = await pool.query('SELECT board_id FROM tasks WHERE id = $1', [taskId]);
    
    if (tasks.length === 0) {
      console.error('Task not found for logging action');
      return;
    }
    
    const boardId = tasks[0].board_id;
    
    // Insert the log
    const { rows: logs } = await pool.query(
      `INSERT INTO action_logs 
       (task_id, user_id, action_type, previous_value, new_value) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [taskId, userId, actionType, JSON.stringify(previousValue), JSON.stringify(newValue)]
    );
    
    // Get additional information for the log
    const { rows: enrichedLogs } = await pool.query(
      `SELECT l.*, t.title as task_title, u.name as user_name
       FROM action_logs l
       JOIN tasks t ON l.task_id = t.id
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [logs[0].id]
    );
    
    // Emit the action logged event
    if (enrichedLogs.length > 0) {
      emitActionLogged(boardId, enrichedLogs[0]);
    }
    
    return logs[0];
  } catch (err) {
    console.error('Error logging action:', err);
  }
};