
// Browser-compatible 2FA implementation using Web Crypto API
export class TwoFactorAuth {
  async generateSecret(userId: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }> {
    // Generate a random secret using Web Crypto API
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    const secret = this.arrayToBase32(array);
    
    // Create OTP Auth URL
    const issuer = 'Solar Crypto AutoTrade';
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userId)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    // Generate QR code URL using a simple SVG-based approach
    const qrCodeUrl = await this.generateQRCodeDataURL(otpAuthUrl);
    
    return {
      secret,
      otpAuthUrl,
      qrCodeUrl
    };
  }
  
  async verifyToken(secret: string, token: string): Promise<boolean> {
    const window = 2; // Allow 2 time steps before/after current
    const currentTime = Math.floor(Date.now() / 1000 / 30); // 30-second time step
    
    for (let i = -window; i <= window; i++) {
      const timeStep = currentTime + i;
      const expectedToken = await this.generateTOTP(secret, timeStep);
      if (expectedToken === token) {
        return true;
      }
    }
    
    return false;
  }
  
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
  
  private arrayToBase32(array: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < array.length; i++) {
      value = (value << 8) | array[i];
      bits += 8;
      
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }
    
    return result;
  }
  
  private base32ToArray(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanInput = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.floor((cleanInput.length * 5) / 8));
    
    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput[i];
      const charIndex = alphabet.indexOf(char);
      
      if (charIndex === -1) continue;
      
      value = (value << 5) | charIndex;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  }
  
  private async generateTOTP(secret: string, timeStep: number): Promise<string> {
    const key = this.base32ToArray(secret);
    const time = new Uint8Array(8);
    
    // Convert time step to big-endian bytes
    for (let i = 7; i >= 0; i--) {
      time[i] = timeStep & 0xff;
      timeStep >>>= 8;
    }
    
    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, time);
    const hmac = new Uint8Array(signature);
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }
  
  private async generateQRCodeDataURL(text: string): Promise<string> {
    // Simple QR code placeholder - in a real implementation, you'd use a QR code library
    // For now, we'll return a simple data URL that shows the text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot create canvas context');
    }
    
    canvas.width = 200;
    canvas.height = 200;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 180, 180);
    
    // Add text
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code Placeholder', 100, 50);
    ctx.font = '10px Arial';
    ctx.fillText('Use your authenticator app', 100, 70);
    ctx.fillText('to scan this code', 100, 85);
    
    // Add the secret in a readable format
    const secret = text.match(/secret=([A-Z2-7]+)/)?.[1] || '';
    if (secret) {
      ctx.font = '14px monospace';
      const chunks = secret.match(/.{1,4}/g) || [];
      let y = 120;
      for (let i = 0; i < chunks.length; i += 4) {
        const line = chunks.slice(i, i + 4).join(' ');
        ctx.fillText(line, 100, y);
        y += 20;
      }
    }
    
    return canvas.toDataURL();
  }
}

export const twoFactorAuth = new TwoFactorAuth();
