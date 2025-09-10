import { supabase } from '../config/supabaseConfig.js';
import { validateRegistration, validateLogin, validatePasswordUpdate } from '../utils/validators.js';

export const register = async (req, res) => {
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
    
    const sanitizedRole = role.toLowerCase().trim();
    
    // Insert new user
    // Note: Storing passwords in plaintext is insecure and should never be done in production
    const { data: newUsers, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, address, password, role: sanitizedRole }])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Registration error:', insertError);
      return res.status(500).json({ error: 'Failed to register user' });
    }
    
    // Return user info without password
    const userId = newUsers.id;
    res.status(201).json({
      id: userId,
      name,
      email,
      role: sanitizedRole
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Add new endpoint for uploading profile image
export const uploadProfileImage = async (req, res) => {
  const { userId, imageBase64 } = req.body;
  
  if (!userId || !imageBase64) {
    return res.status(400).json({ error: 'User ID and image are required' });
  }
  
  try {
    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (userError) {
      console.error('Error checking user:', userError);
      return res.status(500).json({ error: 'Failed to check user' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    
    // Upload to Supabase Storage
    const fileName = `profile-${userId}-${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    // Update user record with image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image_url: publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user profile image:', updateError);
      return res.status(500).json({ error: 'Failed to update user profile image' });
    }
    
    res.json({ imageUrl: publicUrl });
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};

// Add endpoint to get user profile including image
export const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, profile_image_url')
      .eq('id', userId);
    
    if (error) {
      console.error('Get user profile error:', error);
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  const validation = validateLogin(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  try {
    // Find user by email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to login' });
    }
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check password (plaintext comparison - insecure, but per requirements)
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Return user info without password
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_image_url: user.profile_image_url
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const updatePassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  
  // Validate input
  const validation = validatePasswordUpdate(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  try {
    // Find user by ID
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (userError) {
      console.error('Error finding user:', userError);
      return res.status(500).json({ error: 'Failed to find user' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Check old password (plaintext comparison - insecure, but per requirements)
    if (user.password !== oldPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
};