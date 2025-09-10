import { supabase } from '../config/supabaseConfig.js';

// Get all tasks for a specific board
export const getAllTasks = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users!assigned_user_id(name)
      `)
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    
    // Format tasks to match original structure
    const formattedTasks = tasks.map(task => ({
      ...task,
      assigned_user_name: task.users ? task.users.name : null
    }));
    
    // Remove nested users object
    const cleanedTasks = formattedTasks.map(task => {
      const { users, ...cleanTask } = task;
      return cleanTask;
    });
    
    res.json(cleanedTasks);
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
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users!assigned_user_id(name),
        creator:users!created_by_id(name)
      `)
      .eq('id', taskId);
    
    if (error) {
      console.error('Error fetching task:', error);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Format task to match original structure
    const task = tasks[0];
    const formattedTask = {
      ...task,
      assigned_user_name: task.assigned_user ? task.assigned_user.name : null,
      creator_name: task.creator ? task.creator.name : null
    };
    
    // Remove nested objects
    const { assigned_user, creator, ...cleanTask } = formattedTask;
    
    res.json(cleanTask);
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
    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('*')
      .eq('title', title)
      .eq('board_id', board_id);
    
    if (checkError) {
      console.error('Error checking existing tasks:', checkError);
      return res.status(500).json({ error: 'Failed to check existing tasks' });
    }
    
    if (existingTasks.length > 0) {
      return res.status(400).json({ error: 'Task title must be unique within a board' });
    }
    
    // Check if title matches column names
    if (['Todo', 'In Progress', 'Done'].includes(title)) {
      return res.status(400).json({ error: 'Task title cannot match column names' });
    }
    
    // Insert new task
    const { data: newTasks, error: insertError } = await supabase
      .from('tasks')
      .insert([{
        title,
        description,
        status: status || 'Todo',
        priority: priority || 'Medium',
        assigned_user_id,
        board_id,
        created_by_id
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating task:', insertError);
      return res.status(500).json({ error: 'Failed to create task' });
    }
    
    // Log the action
    await logAction(newTasks.id, created_by_id, 'create', null, {
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      assigned_user_id
    });
    
    res.status(201).json(newTasks);
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
    const { data: currentTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (fetchError) {
      console.error('Error fetching current task:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch current task' });
    }
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Check for conflicts if client_version is provided
    if (client_version && client_version !== currentTask.version) {
      // Create a conflict record
      const { error: conflictError } = await supabase
        .from('task_conflicts')
        .insert([{
          task_id: taskId,
          user_id,
          server_version: JSON.stringify(currentTask),
          client_version: JSON.stringify(req.body)
        }]);
      
      if (conflictError) {
        console.error('Error creating conflict record:', conflictError);
      }
      
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
      
      const { data: existingTasks, error: titleCheckError } = await supabase
        .from('tasks')
        .select('*')
        .eq('title', title)
        .eq('board_id', currentTask.board_id)
        .neq('id', taskId);
      
      if (titleCheckError) {
        console.error('Error checking title uniqueness:', titleCheckError);
        return res.status(500).json({ error: 'Failed to check title uniqueness' });
      }
      
      if (existingTasks.length > 0) {
        return res.status(400).json({ error: 'Task title must be unique within a board' });
      }
    }
    
    // Prepare update object
    let updateData = {};
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    
    if (assigned_user_id !== undefined) {
      updateData.assigned_user_id = assigned_user_id;
    }
    
    // Execute update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      // Use RPC to increment version and update timestamp
      const { data: updatedTasks, error: updateError } = await supabase.rpc('update_task_with_version', {
        task_id: taskId,
        update_data: updateData
      });
      
      if (updateError) {
        // Fallback to regular update if RPC doesn't exist
        const { data: fallbackTasks, error: fallbackError } = await supabase
          .from('tasks')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId)
          .select()
          .single();
        
        if (fallbackError) {
          console.error('Error updating task:', fallbackError);
          return res.status(500).json({ error: 'Failed to update task' });
        }
        
        // Log the action
        await logAction(taskId, user_id, 'update', currentTask, fallbackTasks);
        
        res.json(fallbackTasks);
      } else {
        // Log the action
        await logAction(taskId, user_id, 'update', currentTask, updatedTasks[0]);
        
        res.json(updatedTasks[0]);
      }
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
    const { data: currentTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (fetchError) {
      console.error('Error fetching task for deletion:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch task for deletion' });
    }
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
    
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
    const { data: currentTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Find user with fewest active tasks using a more complex query
    const { data: userTaskCounts, error: countError } = await supabase
      .from('users')
      .select(`
        id, name,
        tasks!assigned_user_id(id, status)
      `)
      .order('id');
    
    if (countError) {
      console.error('Error fetching user task counts:', countError);
      return res.status(500).json({ error: 'Failed to fetch user task counts' });
    }
    
    if (userTaskCounts.length === 0) {
      return res.status(404).json({ error: 'No users available for assignment' });
    }
    
    // Calculate task counts and find user with minimum active tasks
    let minTaskCount = Infinity;
    let smartAssignedUser = null;
    
    userTaskCounts.forEach(user => {
      const activeTasks = user.tasks.filter(task => task.status !== 'Done');
      const taskCount = activeTasks.length;
      
      if (taskCount < minTaskCount) {
        minTaskCount = taskCount;
        smartAssignedUser = {
          id: user.id,
          name: user.name,
          task_count: taskCount
        };
      }
    });
    
    if (!smartAssignedUser) {
      return res.status(404).json({ error: 'No users available for assignment' });
    }
    
    // Update task assignment
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_user_id: smartAssignedUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating task assignment:', updateError);
      return res.status(500).json({ error: 'Failed to update task assignment' });
    }
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'smart_assign', 
      { assigned_user_id: currentTask.assigned_user_id }, 
      { assigned_user_id: smartAssignedUser.id }
    );
    
    res.json({
      ...updatedTasks,
      assigned_user_name: smartAssignedUser.name,
      message: `Task smartly assigned to ${smartAssignedUser.name} who has ${smartAssignedUser.task_count} active tasks`
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
    const { data: currentTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Update task status
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating task status:', updateError);
      return res.status(500).json({ error: 'Failed to update task status' });
    }
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'status_change', 
      { status: currentTask.status }, 
      { status }
    );
    
    res.json(updatedTasks);
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
    const { data: currentTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId);
    
    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
    
    if (currentTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = currentTasks[0];
    
    // Get user data to include name in response
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update task assignment
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating task assignment:', updateError);
      return res.status(500).json({ error: 'Failed to update task assignment' });
    }
    
    // Log the action
    await logAction(
      taskId, 
      user_id, 
      'assign', 
      { assigned_user_id: currentTask.assigned_user_id }, 
      { assigned_user_id: userId }
    );
    
    res.json({
      ...updatedTasks,
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
    const { error } = await supabase
      .from('action_logs')
      .insert([{
        task_id: taskId,
        user_id: userId,
        action_type: actionType,
        previous_value: JSON.stringify(previousValue),
        new_value: JSON.stringify(newValue)
      }]);
    
    if (error) {
      console.error('Error logging action:', error);
    }
  } catch (err) {
    console.error('Error logging action:', err);
  }
}