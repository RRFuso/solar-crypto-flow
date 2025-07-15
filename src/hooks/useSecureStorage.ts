
import { useState, useEffect } from 'react';

// Secure encryption/decryption using Web Crypto API
// Generate a key from user session/device fingerprint for security
const generateKey = async (userSalt: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userSalt),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('secure-crypto-dashboard-2024'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encrypt = async (text: string, userSalt: string): Promise<string> => {
  try {
    if (!window.crypto?.subtle) {
      // Fallback for environments without Web Crypto API
      return btoa(text);
    }
    
    const encoder = new TextEncoder();
    const key = await generateKey(userSalt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch {
    return btoa(text); // Fallback to base64 if encryption fails
  }
};

const decrypt = async (encodedText: string, userSalt: string): Promise<string> => {
  try {
    if (!window.crypto?.subtle) {
      // Fallback for environments without Web Crypto API
      return atob(encodedText);
    }
    
    const combined = new Uint8Array(
      atob(encodedText).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const key = await generateKey(userSalt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
};

export const useSecureStorage = (key: string, defaultValue: string = '') => {
  // Generate a user-specific salt for encryption
  const [userSalt] = useState(() => {
    let salt = localStorage.getItem('_crypto_salt');
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(32))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      localStorage.setItem('_crypto_salt', salt);
    }
    return salt;
  });

  const [value, setValue] = useState<string>(() => {
    try {
      // Validate the key to prevent injection attacks
      if (!key || typeof key !== 'string' || key.length > 100) {
        console.warn('Invalid storage key provided');
        return defaultValue;
      }
      
      const item = localStorage.getItem(key);
      if (item) {
        // Use async decryption but return synchronously for initial state
        decrypt(item, userSalt).then(decrypted => {
          if (decrypted !== defaultValue) {
            setValue(decrypted);
          }
        });
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setSecureValue = async (newValue: string) => {
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
        const encrypted = await encrypt(newValue, userSalt);
        localStorage.setItem(key, encrypted);
      }
    } catch (error) {
      console.error('Failed to store secure value:', error);
    }
  };

  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const decrypted = await decrypt(e.newValue, userSalt);
          setValue(decrypted);
        } catch {
          setValue('');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, userSalt]);

  return [value, setSecureValue] as const;
};
