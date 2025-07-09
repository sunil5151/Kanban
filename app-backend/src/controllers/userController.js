import { pool } from '../config/dbConfig.js';
import { isValidRating } from '../utils/validators.js';

// Get all companies with search functionality and user's application
export const getAllStores = async (req, res) => {
  try {
    const { userId, name, address } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Build the WHERE clause for search
    let whereClause = '';
    const params = [userId];
    let paramIndex = 2; // Start from $2 since $1 is already used
    
    if (name && address) {
      whereClause = `WHERE c.name ILIKE $${paramIndex++} AND c.address ILIKE $${paramIndex++}`;
      params.push(`%${name}%`, `%${address}%`);
    } else if (name) {
      whereClause = `WHERE c.name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    } else if (address) {
      whereClause = `WHERE c.address ILIKE $${paramIndex++}`;
      params.push(`%${address}%`);
    }
    
    const query = `
      SELECT 
        c.id, c.name, c.address, 
        COALESCE(AVG(a.rating), 0) AS averageRating, 
        (
          SELECT a2.rating 
          FROM applications a2 
          WHERE a2.company_id = c.id AND a2.user_id = $1 
        ) AS userRating 
      FROM companies c 
      LEFT JOIN applications a ON c.id = a.company_id 
      ${whereClause}
      GROUP BY c.id, c.name, c.address 
      ORDER BY c.name ASC
    `;
    
    const { rows: companies } = await pool.query(query, params);
    
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

// Rename function but keep the same name for API compatibility
export const getAllCompanies = getAllStores;

// Submit or update an application for a company
export const submitRating = async (req, res) => {
  try {
    const { userId, rating, proposal } = req.body;
    const companyId = req.params.storeId;
    
    // Validate inputs
    if (!userId || !companyId || rating === undefined) {
      return res.status(400).json({ error: 'User ID, company ID, and rating are required' });
    }
    
    if (!isValidRating(rating)) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    
    // Check if user has already applied to this company
    const { rows: existingApplications } = await pool.query(
      'SELECT id FROM applications WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    );
    
    let result;
    
    if (existingApplications.length > 0) {
      // Update existing application
      result = await pool.query(
        'UPDATE applications SET rating = $1, proposal = $2 WHERE id = $3',
        [rating, proposal, existingApplications[0].id]
      );
    } else {
      // Insert new application
      result = await pool.query(
        'INSERT INTO applications (user_id, company_id, rating, proposal) VALUES ($1, $2, $3, $4)',
        [userId, companyId, rating, proposal]
      );
    }
    
    // Get updated company info with new average rating
    const { rows: companies } = await pool.query(
      `SELECT 
        c.id, c.name, c.address, 
        COALESCE(AVG(a.rating), 0) AS averageRating, 
        (
          SELECT a2.rating 
          FROM applications a2 
          WHERE a2.company_id = c.id AND a2.user_id = $1 
        ) AS userRating,
        (
          SELECT a2.proposal 
          FROM applications a2 
          WHERE a2.company_id = c.id AND a2.user_id = $1 
        ) AS userProposal
      FROM companies c 
      LEFT JOIN applications a ON c.id = a.company_id 
      WHERE c.id = $2 
      GROUP BY c.id, c.name, c.address`,
      [userId, companyId]
    );
    
    res.json(companies[0] || { message: 'Application submitted but company not found' });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// Rename function but keep the same name for API compatibility
export const submitApplication = submitRating;