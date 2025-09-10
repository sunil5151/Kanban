import { supabase } from '../config/supabaseConfig.js';
import { emitConflictDetected } from './socketController.js';
import { logAction } from './logController.js';

// Get conflicts for a user
export const getConflicts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data: conflicts, error } = await supabase
      .from('task_conflicts')
      .select(`
        *,
        tasks!task_id(title, board_id)
      `)
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conflicts:', error);
      return res.status(500).json({ error: 'Failed to fetch conflicts' });
    }
    
    // Format response to match original structure
    const formattedConflicts = conflicts.map(conflict => ({
      ...conflict,
      task_title: conflict.tasks ? conflict.tasks.title : null,
      board_id: conflict.tasks ? conflict.tasks.board_id : null
    }));
    
    // Remove nested tasks object
    const cleanedConflicts = formattedConflicts.map(conflict => {
      const { tasks, ...cleanConflict } = conflict;
      return cleanConflict;
    });
    
    res.json(cleanedConflicts);
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
    const { data: conflicts, error: conflictError } = await supabase
      .from('task_conflicts')
      .select('*')
      .eq('id', conflictId);
    
    if (conflictError) {
      console.error('Error fetching conflict:', conflictError);
      return res.status(500).json({ error: 'Failed to fetch conflict' });
    }
    
    if (conflicts.length === 0) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    const conflict = conflicts[0];
    
    // Get the current task data
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', conflict.task_id);
    
    if (taskError) {
      console.error('Error fetching task:', taskError);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Handle the resolution
    if (resolution === 'overwrite') {
      // Use the client version
      const clientVersion = JSON.parse(conflict.client_version);
      
      // Update the task with the client version
      const { data: updatedTasks, error: updateError } = await supabase
        .from('tasks')
        .update({
          title: clientVersion.title || task.title,
          description: clientVersion.description || task.description,
          status: clientVersion.status || task.status,
          priority: clientVersion.priority || task.priority,
          assigned_user_id: clientVersion.assigned_user_id || task.assigned_user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating task with overwrite:', updateError);
        return res.status(500).json({ error: 'Failed to update task with overwrite' });
      }
      
      // Log the action
      await logAction(task.id, userId, 'conflict_resolve_overwrite', task, updatedTasks);
      
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
      const { data: updatedTasks, error: updateError } = await supabase
        .from('tasks')
        .update({
          title: mergedVersion.title,
          description: mergedVersion.description,
          status: mergedVersion.status,
          priority: mergedVersion.priority,
          assigned_user_id: mergedVersion.assigned_user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating task with merge:', updateError);
        return res.status(500).json({ error: 'Failed to update task with merge' });
      }
      
      // Log the action
      await logAction(task.id, userId, 'conflict_resolve_merge', task, updatedTasks);
    }
    
    // Mark the conflict as resolved
    const { error: resolveError } = await supabase
      .from('task_conflicts')
      .update({ resolved: true })
      .eq('id', conflictId);
    
    if (resolveError) {
      console.error('Error marking conflict as resolved:', resolveError);
      return res.status(500).json({ error: 'Failed to mark conflict as resolved' });
    }
    
    res.json({ message: 'Conflict resolved successfully' });
  } catch (err) {
    console.error('Error resolving conflict:', err);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
};