import { pool } from '../config/dbConfig.js';

// Get all boards
export const getAllBoards = async (req, res) => {
  try {
    // Remove the userId filtering to show all boards to everyone
    let query = `
      SELECT b.*, u.name as owner_name, 
      COUNT(t.id) as task_count
      FROM boards b
      LEFT JOIN users u ON b.owner_user_id = u.id
      LEFT JOIN tasks t ON b.id = t.board_id
      GROUP BY b.id, u.name ORDER BY b.created_at DESC
    `;
    
    const { rows: boards } = await pool.query(query);
    
    res.json(boards);
  } catch (err) {
    console.error('Error fetching boards:', err);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
};

// Get a specific board with its tasks
export const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    // Get board details
    const { rows: boards } = await pool.query(
      `SELECT b.*, u.name as owner_name
       FROM boards b
       LEFT JOIN users u ON b.owner_user_id = u.id
       WHERE b.id = $1`,
      [boardId]
    );
    
    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Get tasks for this board
    const { rows: tasks } = await pool.query(
      `SELECT t.*, u.name as assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.board_id = $1
       ORDER BY t.created_at DESC`,
      [boardId]
    );
    
    // Group tasks by status
    const tasksByStatus = {
      'Todo': tasks.filter(task => task.status === 'Todo'),
      'In Progress': tasks.filter(task => task.status === 'In Progress'),
      'Done': tasks.filter(task => task.status === 'Done')
    };
    
    res.json({
      ...boards[0],
      tasks: tasksByStatus
    });
  } catch (err) {
    console.error('Error fetching board:', err);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
};

// Create a new board
export const createBoard = async (req, res) => {
  try {
    const { name, description, owner_user_id } = req.body;
    
    if (!name || !owner_user_id) {
      return res.status(400).json({ error: 'Name and owner user ID are required' });
    }
    
    // Insert new board
    const { rows } = await pool.query(
      `INSERT INTO boards (name, description, owner_user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, owner_user_id]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating board:', err);
    res.status(500).json({ error: 'Failed to create board' });
  }
};

// Update a board
export const updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, description } = req.body;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    // Check if board exists
    const { rows: existingBoards } = await pool.query(
      'SELECT * FROM boards WHERE id = $1',
      [boardId]
    );
    
    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Prepare update query
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    
    // Add board ID as the last parameter
    queryParams.push(boardId);
    
    // Execute update if there are fields to update
    if (updateFields.length > 0) {
      const { rows: updatedBoards } = await pool.query(
        `UPDATE boards
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        queryParams
      );
      
      res.json(updatedBoards[0]);
    } else {
      res.json(existingBoards[0]);
    }
  } catch (err) {
    console.error('Error updating board:', err);
    res.status(500).json({ error: 'Failed to update board' });
  }
};

// Delete a board
export const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    // Check if board exists
    const { rows: existingBoards } = await pool.query(
      'SELECT * FROM boards WHERE id = $1',
      [boardId]
    );
    
    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Get all tasks associated with this board
    const { rows: tasks } = await pool.query(
      'SELECT id FROM tasks WHERE board_id = $1',
      [boardId]
    );
    
    // If there are tasks, delete their action logs first
    if (tasks.length > 0) {
      const taskIds = tasks.map(task => task.id);
      
      // Delete action logs for these tasks
      await pool.query(
        'DELETE FROM action_logs WHERE task_id = ANY($1::int[])',
        [taskIds]
      );
      
      // Delete any task locks
      await pool.query(
        'DELETE FROM task_locks WHERE task_id = ANY($1::int[])',
        [taskIds]
      );
      
      // Delete any task conflicts
      await pool.query(
        'DELETE FROM task_conflicts WHERE task_id = ANY($1::int[])',
        [taskIds]
      );
    }
    
    // Now it's safe to delete the tasks
    await pool.query('DELETE FROM tasks WHERE board_id = $1', [boardId]);
    
    // Delete the board
    await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);
    
    res.json({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error('Error deleting board:', err);
    res.status(500).json({ error: 'Failed to delete board' });
  }
};