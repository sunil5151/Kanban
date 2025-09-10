import { supabase } from '../config/supabaseConfig.js';
import { isValidRating } from '../utils/validators.js';

// Get all companies with search functionality and user's application
export const getAllStores = async (req, res) => {
  try {
    const { userId, name, address } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Build query with filters
    let query = supabase
      .from('companies')
      .select(`
        id, name, address,
        applications(rating, user_id)
      `);
    
    // Apply name filter if provided
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    
    // Apply address filter if provided
    if (address) {
      query = query.ilike('address', `%${address}%`);
    }
    
    const { data: companies, error } = await query.order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }
    
    // Process results to match original format
    const processedCompanies = companies.map(company => {
      const ratings = company.applications.map(app => app.rating).filter(rating => rating != null);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
      
      // Find user's rating
      const userApplication = company.applications.find(app => app.user_id == userId);
      const userRating = userApplication ? userApplication.rating : null;
      
      return {
        id: company.id,
        name: company.name,
        address: company.address,
        averagerating: parseFloat(averageRating.toFixed(10)), // Match original precision
        userrating: userRating
      };
    });
    
    res.json(processedCompanies);
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
    const { data: existingApplications, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId);
    
    if (checkError) {
      console.error('Error checking existing applications:', checkError);
      return res.status(500).json({ error: 'Failed to check existing applications' });
    }
    
    let result;
    
    if (existingApplications.length > 0) {
      // Update existing application
      const { error: updateError } = await supabase
        .from('applications')
        .update({ rating, proposal })
        .eq('id', existingApplications[0].id);
      
      if (updateError) {
        console.error('Error updating application:', updateError);
        return res.status(500).json({ error: 'Failed to update application' });
      }
    } else {
      // Insert new application
      const { error: insertError } = await supabase
        .from('applications')
        .insert([{ user_id: userId, company_id: companyId, rating, proposal }]);
      
      if (insertError) {
        console.error('Error creating application:', insertError);
        return res.status(500).json({ error: 'Failed to create application' });
      }
    }
    
    // Get updated company info with new average rating
    const { data: updatedCompany, error: companyError } = await supabase
      .from('companies')
      .select(`
        id, name, address,
        applications(rating, user_id, proposal)
      `)
      .eq('id', companyId)
      .single();
    
    if (companyError) {
      console.error('Error fetching updated company:', companyError);
      return res.status(500).json({ error: 'Failed to fetch updated company info' });
    }
    
    // Calculate new average rating and get user data
    const ratings = updatedCompany.applications.map(app => app.rating).filter(rating => rating != null);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    
    const userApplication = updatedCompany.applications.find(app => app.user_id == userId);
    
    const responseData = {
      id: updatedCompany.id,
      name: updatedCompany.name,
      address: updatedCompany.address,
      averagerating: parseFloat(averageRating.toFixed(10)), // Match original precision
      userrating: userApplication ? userApplication.rating : null,
      userproposal: userApplication ? userApplication.proposal : null
    };
    
    res.json(responseData);
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// Rename function but keep the same name for API compatibility
export const submitApplication = submitRating;