
// Input validation utilities for security
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateSymbol = (symbol: string): boolean => {
  const symbolRegex = /^[A-Z0-9]{1,10}$/;
  return symbolRegex.test(symbol);
};

export const validateNumericInput = (input: string): boolean => {
  const num = parseFloat(input);
  return !isNaN(num) && isFinite(num);
};

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
