import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'store_owner':
        return <Navigate to="/owner" replace />;
      default:
        return <Navigate to="/user" replace />;
    }
  }
  
  return children;
}

export default ProtectedRoute;