import { supabase } from '../config/supabaseConfig.js';
import { emitActionLogged } from './socketController.js';

// Get recent logs (20 most recent)
export const getRecentLogs = async (req, res) => {
  try {
    const { boardId } = req.query;
    
    let query = supabase
      .from('action_logs')
      .select(`
        *,
        tasks!task_id(title, board_id),
        users!user_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Add board filter if provided
    if (boardId) {
      query = query.eq('tasks.board_id', boardId);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
    
    // Format response to match original structure
    const formattedLogs = logs.map(log => ({
      ...log,
      task_title: log.tasks ? log.tasks.title : null,
      board_id: log.tasks ? log.tasks.board_id : null,
      user_name: log.users ? log.users.name : null
    }));
    
    // Remove nested objects to match original format
    const cleanedLogs = formattedLogs.map(log => {
      const { tasks, users, ...cleanLog } = log;
      return cleanLog;
    });
    
    res.json(cleanedLogs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Log an action (internal function)
export const logAction = async (taskId, userId, actionType, previousValue, newValue) => {
  try {
    // Get the board ID for the task
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('board_id')
      .eq('id', taskId);
    
    if (taskError) {
      console.error('Error fetching task for logging:', taskError);
      return;
    }
    
    if (tasks.length === 0) {
      console.error('Task not found for logging action');
      return;
    }
    
    const boardId = tasks[0].board_id;
    
    // Insert the log
    const { data: logs, error: insertError } = await supabase
      .from('action_logs')
      .insert([{
        task_id: taskId,
        user_id: userId,
        action_type: actionType,
        previous_value: JSON.stringify(previousValue),
        new_value: JSON.stringify(newValue)
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting log:', insertError);
      return;
    }
    
    // Get additional information for the log
    const { data: enrichedLogs, error: enrichError } = await supabase
      .from('action_logs')
      .select(`
        *,
        tasks!task_id(title),
        users!user_id(name)
      `)
      .eq('id', logs.id)
      .single();
    
    if (enrichError) {
      console.error('Error enriching log:', enrichError);
      return logs;
    }
    
    // Format the enriched log to match original structure
    const formattedLog = {
      ...enrichedLogs,
      task_title: enrichedLogs.tasks ? enrichedLogs.tasks.title : null,
      user_name: enrichedLogs.users ? enrichedLogs.users.name : null
    };
    
    // Remove nested objects
    const { tasks: _, users: __, ...cleanLog } = formattedLog;
    
    // Emit the action logged event
    emitActionLogged(boardId, cleanLog);
    
    return logs;
  } catch (err) {
    console.error('Error logging action:', err);
  }
};