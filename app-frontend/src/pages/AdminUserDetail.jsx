import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminApi from '../api/adminApi';

function AdminUserDetail() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not admin
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const data = await adminApi.getUserById(id);
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err.error || 'Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [id, user, navigate]);
  
  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading user details...</div>;
  }
  
  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
        <Link 
          to="/admin/users"
          style={{
            padding: '8px 16px',
            backgroundColor: '#607d8b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Back to Users
        </Link>
      </div>
    );
  }
  
  if (!userData) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>User not found</div>;
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>User Details</h1>
        <Link 
          to="/admin/users"
          style={{
            padding: '8px 16px',
            backgroundColor: '#607d8b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Back to Users
        </Link>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#e0e0e0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginRight: '15px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#757575'
          }}>
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>{userData.name}</h2>
            <span style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: 
                userData.role === 'admin' ? '#ff9800' : 
                userData.role === 'contractor' ? '#2196f3' : 
                '#4caf50',
              color: 'white'
            }}>
              {userData.role}
            </span>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#757575' }}>Email</h3>
            <p style={{ margin: '0', fontSize: '16px' }}>{userData.email}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#757575' }}>Address</h3>
            <p style={{ margin: '0', fontSize: '16px' }}>{userData.address}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#757575' }}>Created At</h3>
            <p style={{ margin: '0', fontSize: '16px' }}>
              {new Date(userData.created_at).toLocaleString()}
            </p>
          </div>
          
          {userData.role === 'contractor' && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Store Owner Information</h3>
              <p style={{ margin: '0', color: '#666' }}>
                This user is a store owner. Store management functionality will be implemented in the next phase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetail;