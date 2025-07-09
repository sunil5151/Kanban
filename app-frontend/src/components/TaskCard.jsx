import { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import taskApi from '../api/taskApi';
import boardApi from '../api/boardApi';
import axios from 'axios';
import { API_BASE } from '../config';

function TaskCard({ task, index, onRefresh }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [isSaving, setIsSaving] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [lockError, setLockError] = useState(null);
  
  // Check for locks when the component mounts or when isEditing changes
  useEffect(() => {
    // If we're editing, we need to maintain the lock
    if (isEditing) {
      const lockInterval = setInterval(() => {
        // Extend the lock every 30 seconds
        lockTask();
      }, 30000);
      
      return () => {
        clearInterval(lockInterval);
        // Release the lock when we stop editing
        if (lockStatus && lockStatus.owner) {
          unlockTask();
        }
      };
    }
  }, [isEditing, lockStatus]);
  
  // Function to lock a task
  const lockTask = async () => {
    try {
      const response = await axios.post(`${API_BASE}/locks/${task.id}/lock`, {
        user_id: user.id,
        user_name: user.name
      });
      
      setLockStatus(response.data);
      setLockError(null);
      return response.data;
    } catch (err) {
      console.error('Error locking task:', err);
      setLockError(err.response?.data || { error: 'Failed to lock task' });
      return null;
    }
  };
  
  // Function to unlock a task
  const unlockTask = async () => {
    try {
      await axios.post(`${API_BASE}/locks/${task.id}/unlock`, {
        user_id: user.id
      });
      
      setLockStatus(null);
      setLockError(null);
    } catch (err) {
      console.error('Error unlocking task:', err);
    }
  };
  
  const handleEdit = async () => {
    // Try to lock the task first
    const lock = await lockTask();
    
    if (lock && lock.owner) {
      setIsEditing(true);
    }
  };
  
  const handleCancel = async () => {
    setIsEditing(false);
    setEditedTask({ ...task });
    // Release the lock
    await unlockTask();
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await taskApi.updateTask(task.id, {
        ...editedTask,
        user_id: user.id,
        client_version: task.version
      });
      
      setIsEditing(false);
      // Release the lock
      await unlockTask();
      
      // Refresh the board to show updated task
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating task:', err);
      // Check if the error is due to duplicate task title
      if (err.response && err.response.data && err.response.data.error === 'Task title must be unique within a board') {
        alert('Task title must be unique within this board. Please choose a different title.');
      }
      // If there's a conflict, it will be handled by the ConflictResolution component
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add the missing handleDelete function
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.deleteTask(task.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };
  
  // Add the missing handleSmartAssign function
  const handleSmartAssign = async () => {
    try {
      await taskApi.smartAssign(task.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error smart assigning task:', err);
    }
  };
  
  // Define priorityColors object
  const priorityColors = {
    'High': '#f44336',
    'Medium': '#ff9800',
    'Low': '#4caf50'
  };
  
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {isEditing ? (
            <form onSubmit={handleSubmit} className="task-edit-form">
              {/* Form fields remain the same */}
              <div className="form-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-actions">
                  <button onClick={handleEdit} disabled={lockError}>Edit</button>
                  <button onClick={handleDelete}>Delete</button>
                </div>
              </div>
              <p>{task.description}</p>
              {lockError && (
                <div className="lock-error">
                  {lockError.message || 'This task is currently being edited by another user'}
                </div>
              )}
              <div className="task-footer">
                <div className="task-priority" style={{ backgroundColor: priorityColors[task.priority] }}>
                  {task.priority}
                </div>
                <div className="task-assignment">
                  {task.assigned_user_name ? (
                    <span>Assigned to: {task.assigned_user_name}</span>
                  ) : (
                    <button onClick={handleSmartAssign}>Smart Assign</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;