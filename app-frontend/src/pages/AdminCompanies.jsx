import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminApi from '../api/adminApi';

function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not admin
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    // Fetch companies
    const fetchCompanies = async () => {
      try {
        const data = await adminApi.getAllStores();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanies();
  }, [user, navigate]);
  
  // Filter companies based on search term
  const filteredCompanies = searchTerm
    ? companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : companies;
  
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manage Companies</h1>
        <div>
          <Link 
            to="/admin/stores/new"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            Create Company
          </Link>
          <Link 
            to="/admin"
            style={{
              padding: '8px 16px',
              backgroundColor: '#607d8b',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '250px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      {isLoading ? (
        <div>Loading companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <div>No companies found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Address</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Average Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px' }}>{company.id}</td>
                  <td style={{ padding: '12px' }}>{company.name}</td>
                  <td style={{ padding: '12px' }}>{company.email}</td>
                  <td style={{ padding: '12px' }}>{company.address}</td>
                  <td style={{ padding: '12px' }}>
                    {`${parseFloat(company.averageRating).toFixed(2)} (${company.ratingsCount} applications)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminCompanies;