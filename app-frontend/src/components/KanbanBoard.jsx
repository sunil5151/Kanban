import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskColumn from './TaskColumn';
import TaskForm from './TaskForm';
import ErrorBoundary from './ErrorBoundary';
import ActivityLog from './ActivityLog';
import ConflictResolution from './ConflictResolution';
import boardApi from '../api/boardApi';
import taskApi from '../api/taskApi';
import conflictApi from '../api/conflictApi';
import {
  initSocket,
  joinBoard,
  leaveBoard,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskStatusChanged,
  onTaskAssigned,
  onConflictDetected,
  onActionLogged,
  cleanupSocket
} from '../utils/socketClient';

function KanbanBoard({ boardId }) {
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create a reusable refresh function
  const refreshBoard = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await boardApi.getBoardById(boardId);
      setBoard(data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing board:', err);
      setError('Failed to refresh board data');
    } finally {
      setRefreshing(false);
    }
  }, [boardId]);
  
  // Fetch board data
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const data = await boardApi.getBoardById(boardId);
        setBoard(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching board:', err);
        setError('Failed to load board data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoard();
  }, [boardId]);
  
  // Fetch conflicts
  useEffect(() => {
    const fetchConflicts = async () => {
      if (!user) return;
      
      try {
        const data = await conflictApi.getConflicts(user.id);
        // Filter conflicts for this board
        const boardConflicts = data.filter(conflict => conflict.board_id === boardId);
        setConflicts(boardConflicts);
        
        // Show conflict modal if there are conflicts
        if (boardConflicts.length > 0 && !showConflictModal) {
          setSelectedConflict(boardConflicts[0]);
          setShowConflictModal(true);
        }
      } catch (err) {
        console.error('Error fetching conflicts:', err);
      }
    };
    
    fetchConflicts();
  }, [user, boardId, showConflictModal]);
  
  // Setup WebSocket
  useEffect(() => {
    if (!user || !boardId) return;
    
    // Initialize socket
    const socket = initSocket(user.id);
    
    // Join board room
    joinBoard(boardId);
    
    // Setup event listeners
    onTaskCreated(handleTaskCreated);
    onTaskUpdated(handleTaskUpdated);
    onTaskDeleted(handleTaskDeleted);
    onTaskStatusChanged(handleTaskStatusChanged);
    onTaskAssigned(handleTaskAssigned);
    onConflictDetected(handleConflictDetected);
    onActionLogged(handleActionLogged);
    
    // Cleanup function
    return () => {
      leaveBoard(boardId);
      cleanupSocket();
    };
  }, [user, boardId]);
  
  // WebSocket event handlers
  const handleTaskCreated = (task) => {
    if (task.board_id === boardId) {
      setBoard(prevBoard => {
        const updatedTasks = { ...prevBoard.tasks };
        updatedTasks[task.status] = [...updatedTasks[task.status], task];
        return { ...prevBoard, tasks: updatedTasks };
      });
    }
  };
  
  const handleTaskUpdated = (task) => {
    if (task.board_id === boardId) {
      setBoard(prevBoard => {
        const updatedTasks = { ...prevBoard.tasks };
        // Find and update the task in its current status column
        Object.keys(updatedTasks).forEach(status => {
          updatedTasks[status] = updatedTasks[status].map(t => 
            t.id === task.id ? task : t
          );
        });
        return { ...prevBoard, tasks: updatedTasks };
      });
    }
  };
  
  const handleTaskDeleted = (taskId) => {
    setBoard(prevBoard => {
      const updatedTasks = { ...prevBoard.tasks };
      // Remove the task from all status columns
      Object.keys(updatedTasks).forEach(status => {
        updatedTasks[status] = updatedTasks[status].filter(t => t.id !== taskId);
      });
      return { ...prevBoard, tasks: updatedTasks };
    });
  };
  
  const handleTaskStatusChanged = ({ taskId, oldStatus, newStatus }) => {
    setBoard(prevBoard => {
      const updatedTasks = { ...prevBoard.tasks };
      // Find the task in the old status column
      const taskIndex = updatedTasks[oldStatus].findIndex(t => t.id === taskId);
      
      if (taskIndex !== -1) {
        // Get the task
        const task = { ...updatedTasks[oldStatus][taskIndex], status: newStatus };
        // Remove from old status
        updatedTasks[oldStatus] = updatedTasks[oldStatus].filter(t => t.id !== taskId);
        // Add to new status
        updatedTasks[newStatus] = [...updatedTasks[newStatus], task];
      }
      
      return { ...prevBoard, tasks: updatedTasks };
    });
  };
  
  const handleTaskAssigned = ({ taskId, userId, userName }) => {
    setBoard(prevBoard => {
      const updatedTasks = { ...prevBoard.tasks };
      // Update the task in all status columns
      Object.keys(updatedTasks).forEach(status => {
        updatedTasks[status] = updatedTasks[status].map(t => 
          t.id === taskId ? { ...t, assigned_user_id: userId, assigned_user_name: userName } : t
        );
      });
      return { ...prevBoard, tasks: updatedTasks };
    });
  };
  
  const handleConflictDetected = ({ taskId, conflict }) => {
    // Refresh conflicts
    conflictApi.getConflicts(user.id).then(data => {
      const boardConflicts = data.filter(c => c.board_id === boardId);
      setConflicts(boardConflicts);
      
      // Show conflict modal if there are conflicts
      if (boardConflicts.length > 0 && !showConflictModal) {
        setSelectedConflict(boardConflicts[0]);
        setShowConflictModal(true);
      }
    });
  };
  
  const handleActionLogged = (log) => {
    // This will be handled by the ActivityLog component
    // which will fetch the latest logs
  };
  
  // Handle drag and drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Get the task that was moved
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;
    
    // Convert draggableId back to a number since it comes as a string from react-beautiful-dnd
    const taskId = parseInt(draggableId, 10);
    
    // If the task was moved to a different column (status change)
    if (sourceColumn !== destinationColumn) {
      try {
        // Update the task status in the backend using the numeric ID
        await taskApi.updateTaskStatus(taskId, destinationColumn);
        
        // Update the local state
        setBoard(prevBoard => {
          const updatedTasks = { ...prevBoard.tasks };
          
          // Find the task in the source column using the numeric ID
          const taskIndex = updatedTasks[sourceColumn].findIndex(t => t.id === taskId);
          
          if (taskIndex !== -1) {
            // Get the task
            const task = { ...updatedTasks[sourceColumn][taskIndex], status: destinationColumn };
            // Remove from source column
            updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter(t => t.id !== taskId);
            // Add to destination column
            updatedTasks[destinationColumn] = [
              ...updatedTasks[destinationColumn].slice(0, destination.index),
              task,
              ...updatedTasks[destinationColumn].slice(destination.index)
            ];
          }
          
          return { ...prevBoard, tasks: updatedTasks };
        });
      } catch (err) {
        console.error('Error updating task status:', err);
        // Revert the UI to the original state
        boardApi.getBoardById(boardId).then(data => setBoard(data));
      }
    }
  };
  
  // Handle task creation
  const handleCreateTask = async (taskData) => {
    try {
      await taskApi.createTask({
        ...taskData,
        board_id: boardId,
        created_by_id: user.id
      });
      
      setShowTaskForm(false);
      // Refresh the board after creating a task
      refreshBoard();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };
  
  // Handle conflict resolution
  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      await conflictApi.resolveConflict(conflictId, resolution, user.id);
      
      // Remove the resolved conflict
      setConflicts(prevConflicts => prevConflicts.filter(c => c.id !== conflictId));
      
      // Close the modal if there are no more conflicts
      if (conflicts.length <= 1) {
        setShowConflictModal(false);
        setSelectedConflict(null);
      } else {
        // Show the next conflict
        setSelectedConflict(conflicts.find(c => c.id !== conflictId));
      }
      
      // Refresh the board data
      const data = await boardApi.getBoardById(boardId);
      setBoard(data);
    } catch (err) {
      console.error('Error resolving conflict:', err);
    }
  };
  
  // Loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!board) return <div>Board not found</div>;
  
  return (
    <div className="kanban-board">
      <div className="board-header">
        <div className="board-title-row">
          <h1>{board.name}</h1>
          <div className="board-actions">
            <button 
              onClick={refreshBoard} 
              disabled={refreshing}
              className="refresh-button"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Board'}
            </button>
            <button onClick={() => setShowTaskForm(true)}>Add Task</button>
          </div>
        </div>
        <p>{board.description}</p>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-container">
          <TaskColumn 
            title="Todo" 
            tasks={board.tasks['Todo'] || []} 
            droppableId="Todo" 
            onRefresh={refreshBoard}
          />
          <TaskColumn 
            title="In Progress" 
            tasks={board.tasks['In Progress'] || []} 
            droppableId="In Progress" 
            onRefresh={refreshBoard}
          />
          <TaskColumn 
            title="Done" 
            tasks={board.tasks['Done'] || []} 
            droppableId="Done" 
            onRefresh={refreshBoard}
          />
        </div>
      </DragDropContext>
      
      <ErrorBoundary>
        <ActivityLog boardId={boardId} />
      </ErrorBoundary>
      
      {showTaskForm && (
        <TaskForm 
          onSubmit={handleCreateTask} 
          onCancel={() => setShowTaskForm(false)} 
        />
      )}
      
      {showConflictModal && selectedConflict && (
        <ConflictResolution 
          conflict={selectedConflict} 
          onResolve={handleResolveConflict} 
          onClose={() => setShowConflictModal(false)} 
        />
      )}
    </div>
  );
}

export default KanbanBoard;