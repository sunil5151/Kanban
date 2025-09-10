import { supabase } from '../config/supabaseConfig.js';
import { validateRegistration } from '../utils/validators.js';

// Get all users with company information for contractors
export const getAllUsers = async (req, res) => {
  try {
    // First check if companies table exists by trying to query it
    let users;
    
    try {
      // Try to get users with company information
      const { data: usersWithCompanies, error: companiesError } = await supabase
        .from('users')
        .select(`
          id, name, email, address, role, created_at,
          companies!owner_user_id(
            id,
            applications(rating, id)
          )
        `)
        .order('name', { ascending: true });
      
      if (!companiesError) {
        // Process users with company data
        users = usersWithCompanies.map(user => {
          const company = user.companies[0]; // Get first company owned by user
          let companyAverageRating = 0;
          let applicationsCount = 0;
          
          if (company && company.applications) {
            const ratings = company.applications.map(app => app.rating).filter(rating => rating != null);
            companyAverageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
            applicationsCount = company.applications.length;
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
            created_at: user.created_at,
            companyid: company ? company.id : null,
            companyaveragerating: parseFloat(companyAverageRating.toFixed(10)),
            applicationscount: applicationsCount
          };
        });
      } else {
        throw companiesError;
      }
    } catch (companiesTableError) {
      // If companies table doesn't exist, use simpler query
      const { data: simpleUsers, error: simpleError } = await supabase
        .from('users')
        .select('id, name, email, address, role, created_at')
        .order('name', { ascending: true });
      
      if (simpleError) {
        throw simpleError;
      }
      
      users = simpleUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        created_at: user.created_at,
        companyid: null,
        companyaveragerating: 0,
        applicationscount: 0
      }));
    }
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all companies with applications
export const getAllStores = async (req, res) => {
  try {
    // First check if companies table exists by trying to query it
    let companies;
    
    try {
      // Try to get companies with applications
      const { data: companiesWithApps, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id, name, email, address,
          applications(rating, id)
        `)
        .order('name', { ascending: true });
      
      if (companiesError) {
        throw companiesError;
      }
      
      // Process companies with application data
      companies = companiesWithApps.map(company => {
        const ratings = company.applications.map(app => app.rating).filter(rating => rating != null);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
        
        return {
          id: company.id,
          name: company.name,
          email: company.email,
          address: company.address,
          averagerating: parseFloat(averageRating.toFixed(10)),
          applicationscount: company.applications.length
        };
      });
    } catch (companiesTableError) {
      // If companies table doesn't exist, return empty array
      companies = [];
    }
    
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

// Rename function but keep the same name for API compatibility
export const getAllCompanies = getAllStores;

// Get user by ID
export const getUserById = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, address, created_at')
      .eq('id', userId);
    
    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
export const createUser = async (req, res) => {
  const { name, email, address, password, role } = req.body;
  
  // Validate input
  const validation = validateRegistration(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  try {
    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Failed to check existing user' });
    }
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Insert new user
    const { data: newUsers, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, address, password, role }])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('User creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Return user info without password
    const userId = newUsers.id;
    res.status(201).json({
      id: userId,
      name,
      email,
      role,
      address
    });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Create new company
export const createStore = async (req, res) => {
  const { name, email, address, items, owner_user_id } = req.body;
  
  try {
    // Check if owner exists and is a contractor
    const { data: owners, error: ownerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', owner_user_id)
      .eq('role', 'contractor');
    
    if (ownerError) {
      console.error('Error checking owner:', ownerError);
      return res.status(500).json({ error: 'Failed to check owner' });
    }
    
    if (owners.length === 0) {
      return res.status(400).json({ error: 'Invalid company owner ID or user is not a contractor' });
    }
    
    // Insert new company
    const { data: newCompanies, error: insertError } = await supabase
      .from('companies')
      .insert([{ name, email, address, owner_user_id }])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Company creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create company' });
    }
    
    // Return company info
    const companyId = newCompanies.id;
    res.status(201).json({
      id: companyId,
      name,
      email,
      address,
      owner_user_id,
      items: items || []
    });
  } catch (err) {
    console.error('Company creation error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
};

// Rename function but keep the same name for API compatibility
export const createCompany = createStore;

// Get company by owner ID
export const getStoreByOwnerId = async (req, res) => {
  const ownerId = req.params.ownerId;
  
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        applications(rating, id)
      `)
      .eq('owner_user_id', ownerId);
    
    if (error) {
      console.error('Error fetching company:', error);
      return res.status(500).json({ error: 'Failed to fetch company' });
    }
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found for this owner' });
    }
    
    const company = companies[0];
    const ratings = company.applications.map(app => app.rating).filter(rating => rating != null);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    
    const responseData = {
      ...company,
      averagerating: parseFloat(averageRating.toFixed(10)),
      applicationscount: company.applications.length
    };
    
    // Remove the applications array from response to match original format
    delete responseData.applications;
    
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

// Rename function but keep the same name for API compatibility
export const getCompanyByOwnerId = getStoreByOwnerId;

// Get users who have applied to a specific company
export const getStoreRatingUsers = async (req, res) => {
  const companyId = req.params.storeId;
  
  try {
    // Check if company exists
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId);
    
    if (companyError) {
      console.error('Error checking company:', companyError);
      return res.status(500).json({ error: 'Failed to check company' });
    }
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get users who applied to this company
    const { data: applicationUsers, error: appsError } = await supabase
      .from('applications')
      .select(`
        rating, proposal, created_at,
        users(id, name, email)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (appsError) {
      console.error('Error fetching application users:', appsError);
      return res.status(500).json({ error: 'Failed to fetch application users' });
    }
    
    // Format response to match original structure
    const formattedUsers = applicationUsers.map(app => ({
      id: app.users.id,
      name: app.users.name,
      email: app.users.email,
      rating: app.rating,
      proposal: app.proposal,
      application_date: app.created_at
    }));
    
    res.json(formattedUsers);
  } catch (err) {
    console.error('Error fetching application users:', err);
    res.status(500).json({ error: 'Failed to fetch application users' });
  }
};

// Rename function but keep the same name for API compatibility
export const getCompanyApplicationUsers = getStoreRatingUsers;