import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminApi from '../api/adminApi';

function AdminCompanyForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    owner_user_id: '',
    items: [{ name: '', price: '', description: '' }]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    // Fetch contractors for dropdown selection
    const fetchContractors = async () => {
      try {
        const users = await adminApi.getAllUsers();
        const owners = users.filter(user => user.role === 'contractor');
        setContractors(owners);
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContractors();
  }, [user, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };
  
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: '', description: '' }]
    }));
  };
  
  const removeItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.owner_user_id) newErrors.owner_user_id = 'Contractor is required';
    
    // Validate items
    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};
      if (!item.name.trim()) itemError.name = 'Tender name is required';
      if (!item.price.trim()) itemError.price = 'Price is required';
      if (Object.keys(itemError).length > 0) itemErrors[index] = itemError;
    });
    
    if (itemErrors.length > 0) newErrors.items = itemErrors;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.createStore(formData);
      navigate('/admin/stores');
    } catch (error) {
      console.error('Store creation error:', error);
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.error || 'Failed to create store' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>Loading contractors...</div>;
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Create New Company</h1>
        <Link 
          to="/admin/stores"
          style={{
            padding: '8px 16px',
            backgroundColor: '#607d8b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Back to Companies
        </Link>
      </div>
      
      {errors.general && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <h2>Company Information</h2>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="owner_user_id" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contractor</label>
              <select
                id="owner_user_id"
                name="owner_user_id"
                value={formData.owner_user_id}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Select a contractor</option>
                {contractors.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                ))}
              </select>
              {errors.owner_user_id && <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.owner_user_id}</div>}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {errors.name && <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.name}</div>}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {errors.email && <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.email}</div>}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
              {errors.address && <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.address}</div>}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Tenders</h2>
            <button 
              type="button" 
              onClick={addItem}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Tender
            </button>
          </div>
          
          {formData.items.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '15px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Tender #{index + 1}</h3>
                {formData.items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#f44336', 
                      color: 'white', 
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor={`item-name-${index}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tender Name</label>
                  <input
                    type="text"
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  {errors.items && errors.items[index] && errors.items[index].name && (
                    <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.items[index].name}</div>
                  )}
                </div>
                
                <div>
                  <label htmlFor={`item-price-${index}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price</label>
                  <input
                    type="text"
                    id={`item-price-${index}`}
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  {errors.items && errors.items[index] && errors.items[index].price && (
                    <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errors.items[index].price}</div>
                  )}
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor={`item-description-${index}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description (Optional)</label>
                  <textarea
                    id={`item-description-${index}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Creating Company...' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCompanyForm;