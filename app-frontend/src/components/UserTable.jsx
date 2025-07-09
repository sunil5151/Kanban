import { Link } from 'react-router-dom';

function UserTable({ users, isLoading }) {
  if (isLoading) {
    return <div>Loading users...</div>;
  }
  
  if (!users || users.length === 0) {
    return <div>No users found.</div>;
  }
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Role</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Company Rating</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>{user.id}</td>
              <td style={{ padding: '12px' }}>{user.name}</td>
              <td style={{ padding: '12px' }}>{user.email}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: 
                    user.role === 'admin' ? '#ff9800' : 
                    user.role === 'contractor' ? '#2196f3' : 
                    '#4caf50',
                  color: 'white'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                {user.role !== 'contractor' ? (
                  "-"
                ) : user.storeId === null ? (
                  "No company"
                ) : (
                  `${parseFloat(user.storeAverageRating).toFixed(2)} (${user.ratingsCount} votes)`
                )}
              </td>
              <td style={{ padding: '12px' }}>
                <Link 
                  to={`/admin/users/${user.id}`}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;