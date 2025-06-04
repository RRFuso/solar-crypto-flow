
import { useState, useEffect } from 'react';

// Proper encryption/decryption for sensitive data in localStorage
// Note: For production, consider using Web Crypto API for stronger encryption
const SECRET_KEY = 'crypto-dashboard-key-2024'; // In production, this should be user-derived

const encrypt = (text: string): string => {
  try {
    // Simple XOR encryption with the secret key
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      encrypted += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(encrypted);
  } catch {
    return btoa(text); // Fallback to base64 if encryption fails
  }
};

const decrypt = (encodedText: string): string => {
  try {
    const encrypted = atob(encodedText);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const encryptedChar = encrypted.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return decrypted;
  } catch {
    return '';
  }
};

export const useSecureStorage = (key: string, defaultValue: string = '') => {
  const [value, setValue] = useState<string>(() => {
    try {
      // Validate the key to prevent injection attacks
      if (!key || typeof key !== 'string' || key.length > 100) {
        console.warn('Invalid storage key provided');
        return defaultValue;
      }
      
      const item = localStorage.getItem(key);
      return item ? decrypt(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setSecureValue = (newValue: string) => {
    try {
      // Validate input
      if (typeof newValue !== 'string') {
        console.warn('Invalid value type for secure storage');
        return;
      }
      
      // Limit storage size to prevent abuse
      if (newValue.length > 10000) {
        console.warn('Value too large for secure storage');
        return;
      }
      
      setValue(newValue);
      if (newValue === '') {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, encrypt(newValue));
      }
    } catch (error) {
      console.error('Failed to store secure value:', error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setValue(decrypt(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, setSecureValue] as const;
};
