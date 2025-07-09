import { useState, useEffect } from 'react';
import logApi from '../api/logApi';
import { onActionLogged } from '../utils/socketClient';

function ActivityLog({ boardId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await logApi.getRecentLogs(boardId);
        setLogs(data);
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [boardId]);
  
  // Listen for new logs
  useEffect(() => {
    const handleNewLog = (log) => {
      if (log.board_id === boardId) {
        setLogs(prevLogs => [log, ...prevLogs.slice(0, 19)]);
      }
    };
    
    onActionLogged(handleNewLog);
    
    return () => {
      // Cleanup is handled by cleanupSocket in KanbanBoard
    };
  }, [boardId]);
  
  // Helper function to safely parse JSON
  const safeJsonParse = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (err) {
      console.error('Error parsing JSON:', value);
      return null;
    }
  };
  
  // Format the log message
  const formatLogMessage = (log) => {
    const { action_type, user_name, task_title, created_at } = log;
    const date = new Date(created_at).toLocaleString();
    
    switch (action_type) {
      case 'create':
        return `${user_name} created task "${task_title}" at ${date}`;
      case 'update':
        return `${user_name} updated task "${task_title}" at ${date}`;
      case 'delete':
        return `${user_name} deleted task "${task_title}" at ${date}`;
      case 'status_change':
        const previous_value = safeJsonParse(log.previous_value);
        const new_value = safeJsonParse(log.new_value);
        if (!previous_value || !new_value) {
          return `${user_name} moved task "${task_title}" at ${date}`;
        }
        return `${user_name} moved task "${task_title}" from ${previous_value.status} to ${new_value.status} at ${date}`;
      case 'assign':
        const assignData = safeJsonParse(log.new_value);
        if (!assignData || !assignData.assigned_user_name) {
          return `${user_name} assigned task "${task_title}" at ${date}`;
        }
        return `${user_name} assigned task "${task_title}" to ${assignData.assigned_user_name} at ${date}`;
      case 'conflict_resolve_overwrite':
        return `${user_name} resolved conflict for task "${task_title}" by overwriting at ${date}`;
      case 'conflict_resolve_merge':
        return `${user_name} resolved conflict for task "${task_title}" by merging at ${date}`;
      default:
        return `${user_name} performed action on task "${task_title}" at ${date}`;
    }
  };
  
  if (loading) return <div className="activity-log loading">Loading activity log...</div>;
  
  return (
    <div className="activity-log">
      <h2>Activity Log</h2>
      <ul className="log-list">
        {logs.length === 0 ? (
          <li className="log-item empty">No activity yet</li>
        ) : (
          logs.map(log => (
            <li key={log.id} className="log-item">
              {formatLogMessage(log)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default ActivityLog;