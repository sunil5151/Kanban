import { pool } from '../config/dbConfig.js';

// Get all tasks for a specific board
export const getAllTasks = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    const { rows: tasks } = await pool.query(
      `SELECT t.*, u.name as assigned_user_name 
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.board_id = $1
       ORDER BY t.created_at DESC`,
      [boardId]
    );
    
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get a specific task by ID
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }
    
    const { rows: tasks } = await pool.query(
      `SELECT t.*, u.name as assigned_user_name, c.name as creator_name 
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       LEFT JOIN users c ON t.created_by_id = c.id
       WHERE t.id = $1`,
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(tasks[0]);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assigned_user_id, board_id, created_by_id } = req.body;
    
    // Validate required fields
    if (!title || !board_id || !created_by_id) {
      return res.status(400).json({ error: 'Title, board ID, and creator ID are required' });
    }
    
    // Check if title is unique for this board
    const { rows: existingTasks } = await pool.query(
      'SELECT * FROM tasks WHERE title = $1 AND board_id = $2',
      [title, board_id]
    );
    
    if (existingTasks.length > 0) {
      return res.status(400).json({ error: 'Task title must be unique within a board' });
    }
    
    // Check if title matches column names
    if (['Todo', 'In Progress', 'Done'].includes(title)) {
      return res.status(400).json({ error: 'Task title cannot match column names' });
    }
    
    // Insert new task
    const { rows } = await pool.query(
      `INSERT INTO tasks 
       (title, description, status, priority, assigned_user_id, board_id, created_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, status || 'Todo', priority || 'Medium', assigned_user_id, board_id, created_by_id]
    );
    
    // Log the action
    await logAction(rows[0].id, created_by_id, 'create', null, {
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      assigned_user_id
    });
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assigned_user_id, user_id, client_version } = req.body;
    
    // Validate required fields
    if (!taskId || !user_id) {
      return res.status(400).json({ error: 'Task ID and user ID are required' });
    }
    
    // Get current task data
    const { rows: currentTasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Check for conflicts if client_version is provided
    if (client_version && client_version !== currentTask.version) {
      // Create a conflict record
      await pool.query(
        `INSERT INTO task_conflicts 
         (task_id, user_id, server_version, client_version) 
         VALUES ($1, $2, $3, $4)`,
        [taskId, user_id, JSON.stringify(currentTask), JSON.stringify(req.body)]
      );
      
      return res.status(409).json({
        error: 'Conflict detected',
        serverVersion: currentTask,
        clientVersion: req.body
      });
    }
    
    // Check if title is unique if it's being changed
    if (title && title !== currentTask.title) {
      // Check if title matches column names
      if (['Todo', 'In Progress', 'Done'].includes(title)) {
        return res.status(400).json({ error: 'Task title cannot match column names' });
      }
      
      const { rows: existingTasks } = await pool.query(
        'SELECT * FROM tasks WHERE title = $1 AND board_id = $2 AND id != $3',
        [title, currentTask.board_id, taskId]
      );
      
      if (existingTasks.length > 0) {
        return res.status(400).json({ error: 'Task title must be unique within a board' });
      }
    }
    
    // Prepare update query
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      queryParams.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }
    
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      queryParams.push(priority);
    }
    
    if (assigned_user_id !== undefined) {
      updateFields.push(`assigned_user_id = $${paramIndex++}`);
      queryParams.push(assigned_user_id);
    }
    
    // Add version increment and updated_at timestamp
    updateFields.push(`version = version + 1`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add task ID as the last parameter
    queryParams.push(taskId);
    
    // Execute update if there are fields to update
    if (updateFields.length > 0) {
      const { rows: updatedTasks } = await pool.query(
        `UPDATE tasks 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        queryParams
      );
      
      // Log the action
      await logAction(taskId, user_id, 'update', currentTask, updatedTasks[0]);
      
      res.json(updatedTasks[0]);
    } else {
      res.json(currentTask);
    }
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Check for user_id in body, query, and params
    const user_id = req.body.user_id || req.query.userId || req.params.userId;
    
    if (!taskId || !user_id) {
      return res.status(400).json({ error: 'Task ID and user ID are required' });
    }
    
    // Get current task data for logging
    const { rows: currentTasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Delete task
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    
    // Log the action
    await logAction(taskId, user_id, 'delete', currentTasks[0], null);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Smart assign a task
export const smartAssign = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Check for user_id in body, query, and params
    const user_id = req.body.user_id || req.query.userId || req.params.userId;
    
    if (!taskId || !user_id) {
      return res.status(400).json({ error: 'Task ID and user ID are required' });
    }
    
    // Get current task data
    const { rows: currentTasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Find user with fewest active tasks
    const { rows: userTaskCounts } = await pool.query(
      `SELECT u.id, u.name, COUNT(t.id) as task_count
       FROM users u
       LEFT JOIN tasks t ON u.id = t.assigned_user_id AND t.status != 'Done'
       GROUP BY u.id, u.name
       ORDER BY task_count ASC
       LIMIT 1`
    );
    
    if (userTaskCounts.length === 0) {
      return res.status(404).json({ error: 'No users available for assignment' });
    }
    
    const smartAssignedUserId = userTaskCounts[0].id;
    
    // Update task assignment
    const { rows: updatedTasks } = await pool.query(
      `UPDATE tasks 
       SET assigned_user_id = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [smartAssignedUserId, taskId]
    );
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'smart_assign', 
      { assigned_user_id: currentTask.assigned_user_id }, 
      { assigned_user_id: smartAssignedUserId }
    );
    
    res.json({
      ...updatedTasks[0],
      assigned_user_name: userTaskCounts[0].name,
      message: `Task smartly assigned to ${userTaskCounts[0].name} who has ${userTaskCounts[0].task_count} active tasks`
    });
  } catch (err) {
    console.error('Error smart assigning task:', err);
    res.status(500).json({ error: 'Failed to smart assign task' });
  }
};

// Update task status (for drag-drop)
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, user_id } = req.body;
    
    if (!taskId || !status || !user_id) {
      return res.status(400).json({ error: 'Task ID, status, and user ID are required' });
    }
    
    // Get current task data
    const { rows: currentTasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Update task status
    const { rows: updatedTasks } = await pool.query(
      `UPDATE tasks 
       SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, taskId]
    );
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'status_change', 
      { status: currentTask.status }, 
      { status }
    );
    
    res.json(updatedTasks[0]);
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

// Assign a task to a user
export const assignTask = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const { user_id } = req.body; // User making the assignment
    
    if (!taskId || !userId || !user_id) {
      return res.status(400).json({ error: 'Task ID, user ID to assign to, and user ID making the assignment are required' });
    }
    
    // Get current task data
    const { rows: currentTasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Get user data to include name in response
    const { rows: users } = await pool.query('SELECT id, name FROM users WHERE id = $1', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update task assignment
    const { rows: updatedTasks } = await pool.query(
      `UPDATE tasks 
       SET assigned_user_id = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [userId, taskId]
    );
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'assign', 
      { assigned_user_id: currentTask.assigned_user_id }, 
      { assigned_user_id: userId }
    );
    
    res.json({
      ...updatedTasks[0],
      assigned_user_name: users[0].name
    });
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ error: 'Failed to assign task' });
  }
};

// Helper function to log actions
async function logAction(taskId, userId, actionType, previousValue, newValue) {
  try {
    await pool.query(
      `INSERT INTO action_logs 
       (task_id, user_id, action_type, previous_value, new_value) 
       VALUES ($1, $2, $3, $4, $5)`,
      [taskId, userId, actionType, JSON.stringify(previousValue), JSON.stringify(newValue)]
    );
  } catch (err) {
    console.error('Error logging action:', err);
  }
}