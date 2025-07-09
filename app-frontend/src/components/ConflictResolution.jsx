import { useState } from 'react';

function ConflictResolution({ conflict, onResolve, onClose }) {
  const [resolution, setResolution] = useState('overwrite');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(conflict.id, resolution);
  };
  
  // Parse the server and client versions
  const serverVersion = JSON.parse(conflict.server_version);
  const clientVersion = JSON.parse(conflict.client_version);
  
  return (
    <div className="conflict-modal-overlay">
      <div className="conflict-modal">
        <h2>Conflict Detected</h2>
        <p>There is a conflict with task "{conflict.task_title}"</p>
        
        <div className="conflict-comparison">
          <div className="server-version">
            <h3>Server Version</h3>
            <p><strong>Title:</strong> {serverVersion.title}</p>
            <p><strong>Description:</strong> {serverVersion.description}</p>
            <p><strong>Status:</strong> {serverVersion.status}</p>
            <p><strong>Priority:</strong> {serverVersion.priority}</p>
          </div>
          
          <div className="client-version">
            <h3>Your Version</h3>
            <p><strong>Title:</strong> {clientVersion.title}</p>
            <p><strong>Description:</strong> {clientVersion.description}</p>
            <p><strong>Status:</strong> {clientVersion.status}</p>
            <p><strong>Priority:</strong> {clientVersion.priority}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="resolution-options">
            <label>
              <input
                type="radio"
                name="resolution"
                value="overwrite"
                checked={resolution === 'overwrite'}
                onChange={() => setResolution('overwrite')}
              />
              Use your version (overwrite server version)
            </label>
            
            <label>
              <input
                type="radio"
                name="resolution"
                value="merge"
                checked={resolution === 'merge'}
                onChange={() => setResolution('merge')}
              />
              Merge versions (keep your changes where they differ)
            </label>
          </div>
          
          <div className="modal-actions">
            <button type="submit">Resolve Conflict</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConflictResolution;