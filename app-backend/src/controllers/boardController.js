import { supabase } from '../config/supabaseConfig.js';

// Get all boards
export const getAllBoards = async (req, res) => {
  try {
    // Remove the userId filtering to show all boards to everyone
    const { data: boards, error } = await supabase
      .from('boards')
      .select(`
        *,
        users!owner_user_id(name),
        tasks(id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching boards:', error);
      return res.status(500).json({ error: 'Failed to fetch boards' });
    }
    
    // Format response to match original structure
    const formattedBoards = boards.map(board => ({
      ...board,
      owner_name: board.users ? board.users.name : null,
      task_count: board.tasks ? board.tasks.length : 0
    }));
    
    // Remove nested objects to match original format
    const cleanedBoards = formattedBoards.map(board => {
      const { users, tasks, ...cleanBoard } = board;
      return cleanBoard;
    });
    
    res.json(cleanedBoards);
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
    const { data: boards, error: boardError } = await supabase
      .from('boards')
      .select(`
        *,
        users!owner_user_id(name)
      `)
      .eq('id', boardId);
    
    if (boardError) {
      console.error('Error fetching board:', boardError);
      return res.status(500).json({ error: 'Failed to fetch board' });
    }
    
    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Get tasks for this board
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        users!assigned_user_id(name)
      `)
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    
    // Format tasks to match original structure
    const formattedTasks = tasks.map(task => ({
      ...task,
      assigned_user_name: task.users ? task.users.name : null
    }));
    
    // Remove nested users object from tasks
    const cleanedTasks = formattedTasks.map(task => {
      const { users, ...cleanTask } = task;
      return cleanTask;
    });
    
    // Group tasks by status
    const tasksByStatus = {
      'Todo': cleanedTasks.filter(task => task.status === 'Todo'),
      'In Progress': cleanedTasks.filter(task => task.status === 'In Progress'),
      'Done': cleanedTasks.filter(task => task.status === 'Done')
    };
    
    // Format board response
    const board = boards[0];
    const responseBoard = {
      ...board,
      owner_name: board.users ? board.users.name : null,
      tasks: tasksByStatus
    };
    
    // Remove nested users object from board
    const { users, ...cleanBoard } = responseBoard;
    
    res.json(cleanBoard);
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
    const { data: newBoards, error } = await supabase
      .from('boards')
      .insert([{ name, description, owner_user_id }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating board:', error);
      return res.status(500).json({ error: 'Failed to create board' });
    }
    
    res.status(201).json(newBoards);
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
    const { data: existingBoards, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId);
    
    if (checkError) {
      console.error('Error checking board:', checkError);
      return res.status(500).json({ error: 'Failed to check board' });
    }
    
    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Prepare update object
    let updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    // Execute update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { data: updatedBoards, error: updateError } = await supabase
        .from('boards')
        .update(updateData)
        .eq('id', boardId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating board:', updateError);
        return res.status(500).json({ error: 'Failed to update board' });
      }
      
      res.json(updatedBoards);
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
    const { data: existingBoards, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId);
    
    if (checkError) {
      console.error('Error checking board:', checkError);
      return res.status(500).json({ error: 'Failed to check board' });
    }
    
    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Get all tasks associated with this board
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('board_id', boardId);
    
    if (tasksError) {
      console.error('Error fetching tasks for deletion:', tasksError);
      return res.status(500).json({ error: 'Failed to fetch tasks for deletion' });
    }
    
    // If there are tasks, delete their action logs first
    if (tasks.length > 0) {
      const taskIds = tasks.map(task => task.id);
      
      // Delete action logs for these tasks
      const { error: logsError } = await supabase
        .from('action_logs')
        .delete()
        .in('task_id', taskIds);
      
      if (logsError) {
        console.error('Error deleting action logs:', logsError);
        // Continue with deletion even if logs fail
      }
      
      // Delete any task locks
      const { error: locksError } = await supabase
        .from('task_locks')
        .delete()
        .in('task_id', taskIds);
      
      if (locksError) {
        console.error('Error deleting task locks:', locksError);
        // Continue with deletion even if locks fail
      }
      
      // Delete any task conflicts
      const { error: conflictsError } = await supabase
        .from('task_conflicts')
        .delete()
        .in('task_id', taskIds);
      
      if (conflictsError) {
        console.error('Error deleting task conflicts:', conflictsError);
        // Continue with deletion even if conflicts fail
      }
    }
    
    // Now it's safe to delete the tasks
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('board_id', boardId);
    
    if (deleteTasksError) {
      console.error('Error deleting tasks:', deleteTasksError);
      return res.status(500).json({ error: 'Failed to delete tasks' });
    }
    
    // Delete the board
    const { error: deleteBoardError } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId);
    
    if (deleteBoardError) {
      console.error('Error deleting board:', deleteBoardError);
      return res.status(500).json({ error: 'Failed to delete board' });
    }
    
    res.json({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error('Error deleting board:', err);
    res.status(500).json({ error: 'Failed to delete board' });
  }
};