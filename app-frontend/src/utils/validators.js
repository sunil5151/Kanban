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

export const validateForm = (formData, fields) => {
  const errors = {};
  
  fields.forEach(field => {
    // First check if field is required
    if (!validateRequired(formData[field])) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      return;
    }
    
    // Then check specific validations based on field type
    switch (field) {
      case 'email':
        if (!validateEmail(formData.email)) {
          errors.email = 'Invalid email format';
        }
        break;
      
      case 'name':
        if (!validateName(formData.name)) {
          errors.name = 'Name must be between 20 and 60 characters';
        }
        break;
      
      case 'address':
        if (!validateAddress(formData.address)) {
          errors.address = 'Address cannot exceed 400 characters';
        }
        break;
      
      case 'password':
        if (!validatePassword(formData.password)) {
          errors.password = 'Password must be 8-16 characters with at least one uppercase letter and one special character';
        }
        break;
      
      default:
        break;
    }
  });
  
  return errors;
};