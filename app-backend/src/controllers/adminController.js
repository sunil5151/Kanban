import { pool } from '../config/dbConfig.js';
import { validateRegistration } from '../utils/validators.js';

// Get all users with company information for contractors
export const getAllUsers = async (req, res) => {
  try {
    // First check if companies table exists
    const { rows: tables } = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'companies'"
    );
    
    let users;
    
    if (parseInt(tables[0].count) > 0) {
      // If companies table exists, use the original query
      const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
          c.id AS companyId, 
          COALESCE(AVG(a.rating), 0) AS companyAverageRating, 
          COUNT(a.id) AS applicationsCount 
        FROM users u 
        LEFT JOIN companies c ON u.id = c.owner_user_id 
        LEFT JOIN applications a ON c.id = a.company_id 
        GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at, c.id 
        ORDER BY u.name ASC`
      );
      users = rows;
    } else {
      // If companies table doesn't exist, use a simpler query
      const { rows } = await pool.query(
        `SELECT id, name, email, address, role, created_at,
          NULL AS companyId,
          0 AS companyAverageRating,
          0 AS applicationsCount
        FROM users
        ORDER BY name ASC`
      );
      users = rows;
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
    // First check if companies table exists
    const { rows: tables } = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'companies'"
    );
    
    if (parseInt(tables[0].count) === 0) {
      // If companies table doesn't exist, return empty array
      return res.json([]);
    }
    
    // Check if applications table exists
    const { rows: applicationTables } = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'applications'"
    );
    
    let companies;
    
    if (parseInt(applicationTables[0].count) > 0) {
      // If applications table exists, use the original query
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.email, c.address, 
          COALESCE(AVG(a.rating), 0) AS averageRating, 
          COUNT(a.id) AS applicationsCount 
        FROM companies c 
        LEFT JOIN applications a ON c.id = a.company_id 
        GROUP BY c.id, c.name, c.email, c.address 
        ORDER BY c.name ASC`
      );
      companies = rows;
    } else {
      // If applications table doesn't exist, use a simpler query
      const { rows } = await pool.query(
        `SELECT id, name, email, address,
          0 AS averageRating,
          0 AS applicationsCount
        FROM companies
        ORDER BY name ASC`
      );
      companies = rows;
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
    const { rows: users } = await pool.query(
      'SELECT id, name, email, role, address, created_at FROM users WHERE id = $1',
      [userId]
    );
    
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
    const { rows: existingUsers } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Insert new user
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, address, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, address, password, role]
    );
    
    // Return user info without password
    const userId = rows[0].id;
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
    const { rows: owners } = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [owner_user_id, 'contractor']
    );
    
    if (owners.length === 0) {
      return res.status(400).json({ error: 'Invalid company owner ID or user is not a contractor' });
    }
    
    // Insert new company
    const { rows } = await pool.query(
      'INSERT INTO companies (name, email, address, owner_user_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, address, owner_user_id]
    );
    
    // Return company info
    const companyId = rows[0].id;
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
    const { rows: companies } = await pool.query(
      `SELECT c.*, COALESCE(AVG(a.rating), 0) AS averageRating, COUNT(a.id) AS applicationsCount 
       FROM companies c 
       LEFT JOIN applications a ON c.id = a.company_id 
       WHERE c.owner_user_id = $1 
       GROUP BY c.id`,
      [ownerId]
    );
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found for this owner' });
    }
    
    res.json(companies[0]);
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
    const { rows: companies } = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [companyId]
    );
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get users who applied to this company
    const { rows: applicationUsers } = await pool.query(
      `SELECT u.id, u.name, u.email, a.rating, a.proposal, a.created_at as application_date
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.company_id = $1
       ORDER BY a.created_at DESC`,
      [companyId]
    );
    
    res.json(applicationUsers);
  } catch (err) {
    console.error('Error fetching application users:', err);
    res.status(500).json({ error: 'Failed to fetch application users' });
  }
};

// Rename function but keep the same name for API compatibility
export const getCompanyApplicationUsers = getStoreRatingUsers;