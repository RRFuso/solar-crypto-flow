
// Enhanced input validation with security focus

// Sanitize input to prevent XSS and injection attacks
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .substring(0, 50); // Limit length to prevent abuse
};

// Validate cryptocurrency symbol format
export const validateSymbol = (symbol: string): boolean => {
  if (!symbol || typeof symbol !== 'string') return false;
  
  // Allow only alphanumeric characters and common crypto symbols
  const symbolRegex = /^[A-Z0-9]{1,10}$/;
  return symbolRegex.test(symbol.toUpperCase());
};

// Validate numeric amounts (prices, volumes, etc.)
export const validateAmount = (amount: number | string): boolean => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  return !isNaN(amount) && 
         isFinite(amount) && 
         amount >= 0 && 
         amount <= Number.MAX_SAFE_INTEGER;
};

// Validate email format with stricter rules
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate password strength
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Validate API rate limiting - simple client-side check
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 60, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.lastReset > windowMs) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Sanitize object data to prevent prototype pollution
export const sanitizeObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key]);
      } else if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeInput(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};
