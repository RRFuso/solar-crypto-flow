
import { useState, useEffect } from 'react';

// Simple encryption/decryption for sensitive data in localStorage
const encrypt = (text: string): string => {
  return btoa(text); // Basic base64 encoding (in production, use proper encryption)
};

const decrypt = (encodedText: string): string => {
  try {
    return atob(encodedText);
  } catch {
    return '';
  }
};

export const useSecureStorage = (key: string, defaultValue: string = '') => {
  const [value, setValue] = useState<string>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? decrypt(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setSecureValue = (newValue: string) => {
    try {
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
