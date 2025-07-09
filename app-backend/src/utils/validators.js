// Basic validation functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value.toString().trim() !== '';
};

// New validation functions for specific requirements
export const validateName = (name) => {
  return name && name.trim().length >= 20 && name.trim().length <= 60;
};

export const validateAddress = (address) => {
  return !address || address.trim().length <= 400;
};

export const validatePassword = (password) => {
  // Check length between 8-16 characters
  if (!password || password.length < 8 || password.length > 16) {
    return false;
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  
  return true;
};

export const validateRegistration = (userData) => {
  const errors = {};
  
  if (!validateRequired(userData.name)) {
    errors.name = 'Name is required';
  } else if (!validateName(userData.name)) {
    errors.name = 'Name must be between 20 and 60 characters';
  }
  
  if (!validateRequired(userData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!validateRequired(userData.password)) {
    errors.password = 'Password is required';
  } else if (!validatePassword(userData.password)) {
    errors.password = 'Password must be 8-16 characters with at least one uppercase letter and one special character';
  }
  
  if (!validateRequired(userData.address)) {
    errors.address = 'Address is required';
  } else if (!validateAddress(userData.address)) {
    errors.address = 'Address cannot exceed 400 characters';
  }
  
  if (!validateRequired(userData.role)) {
    errors.role = 'Role is required';
  } else if (!['user', 'admin', 'contractor'].includes(userData.role)) {
    errors.role = 'Invalid role';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLogin = (userData) => {
  const errors = {};
  
  if (!validateRequired(userData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!validateRequired(userData.password)) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const isValidRating = (r) => {
  const n = Number(r);
  return Number.isInteger(n) && n >= 1 && n <= 5;
};

export const validatePasswordUpdate = (data) => {
  const errors = {};
  
  if (!validateRequired(data.userId)) {
    errors.userId = 'User ID is required';
  }
  
  if (!validateRequired(data.oldPassword)) {
    errors.oldPassword = 'Old password is required';
  }
  
  if (!validateRequired(data.newPassword)) {
    errors.newPassword = 'New password is required';
  } else if (data.newPassword.length < 4) {
    errors.newPassword = 'Password must be at least 4 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};