import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import boardApi from '../api/boardApi';

function BoardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [newBoard, setNewBoard] = useState({ name: '', description: '' });
  
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        // Remove the user.id parameter to fetch all boards
        const data = await boardApi.getAllBoards();
        setBoards(data);
      } catch (err) {
        console.error('Error fetching boards:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoards();
  }, []);
  
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const createdBoard = await boardApi.createBoard({
        ...newBoard,
        owner_user_id: user.id
      });
      
      setBoards(prevBoards => [createdBoard, ...prevBoards]);
      setNewBoard({ name: '', description: '' });
      setShowBoardForm(false);
    } catch (err) {
      console.error('Error creating board:', err);
    }
  };
  
  const handleBoardClick = (boardId) => {
    navigate(`/boards/${boardId}`);
  };
  
  // Add this new function to handle board deletion
  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation(); // Prevent navigating to the board detail page
    
    if (window.confirm('Are you sure you want to delete this board? All tasks will be deleted as well.')) {
      try {
        await boardApi.deleteBoard(boardId);
        // Remove the deleted board from the state
        setBoards(prevBoards => prevBoards.filter(board => board.id !== boardId));
      } catch (err) {
        console.error('Error deleting board:', err);
        alert('Failed to delete board. Please try again.');
      }
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBoard(prev => ({ ...prev, [name]: value }));
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="boards-page">
      <div className="boards-header">
        <h1>All Boards</h1>
        <button onClick={() => setShowBoardForm(true)}>Create New Board</button>
      </div>
      
      {showBoardForm && (
        <div className="board-form">
          <h2>Create New Board</h2>
          <form onSubmit={handleCreateBoard}>
            <div className="form-group">
              <label htmlFor="name">Board Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newBoard.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newBoard.description}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit">Create Board</button>
              <button type="button" onClick={() => setShowBoardForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      <div className="boards-list">
        {boards.length === 0 ? (
          <p>No boards available. Create one to get started!</p>
        ) : (
          boards.map(board => (
            <div 
              key={board.id} 
              className="board-card" 
              onClick={() => handleBoardClick(board.id)}
            >
              <div className="board-card-header">
                <h2>{board.name}</h2>
                <button 
                  className="delete-board-btn" 
                  onClick={(e) => handleDeleteBoard(e, board.id)}
                >
                  Delete
                </button>
              </div>
              <p>{board.description}</p>
              <div className="board-stats">
                <span>{board.task_count} tasks</span>
                <span>Created: {new Date(board.created_at).toLocaleDateString()}</span>
                <span>Owner: {board.owner_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BoardsPage;