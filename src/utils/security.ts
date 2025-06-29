
// Security utility functions

// Content Security Policy configuration
export const getCSPDirectives = () => {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'connect-src': ["'self'", "https://bahshstcztvqmxiubslx.supabase.co", "wss://bahshstcztvqmxiubslx.supabase.co"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };
};

// Generate CSP header string
export const generateCSPHeader = (): string => {
  const directives = getCSPDirectives();
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

// Sanitize HTML content to prevent XSS
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Check if running in secure context
export const isSecureContext = (): boolean => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
};

// Generate secure random string for CSRF tokens
export const generateSecureToken = (length: number = 32): string => {
  if (!isSecureContext()) {
    console.warn('Generating token in insecure context');
  }
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Audit logging helper
export const logSecurityEvent = async (event: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    userAgent: navigator.userAgent,
    url: window.location.href,
    details: details || {}
  };
  
  console.log('Security Event:', logEntry);
  
  // In a real application, you would send this to your security monitoring system
  // For now, we'll just log to console
};

// Detect potential security threats
export const detectSuspiciousActivity = (action: string, frequency: number = 10, timeWindow: number = 60000) => {
  const key = `security_${action}`;
  const now = Date.now();
  
  const stored = localStorage.getItem(key);
  let attempts = stored ? JSON.parse(stored) : [];
  
  // Clean old attempts
  attempts = attempts.filter((timestamp: number) => now - timestamp < timeWindow);
  
  // Add current attempt
  attempts.push(now);
  
  // Store updated attempts
  localStorage.setItem(key, JSON.stringify(attempts));
  
  // Check if threshold exceeded
  if (attempts.length > frequency) {
    logSecurityEvent('suspicious_activity_detected', { action, attempts: attempts.length });
    return true;
  }
  
  return false;
};

// Security headers for fetch requests
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};
