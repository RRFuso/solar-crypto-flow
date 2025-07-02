
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export class TwoFactorAuth {
  async generateSecret(userId: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }> {
    const secret = speakeasy.generateSecret({
      name: `SolarCrypto:${userId}`,
      issuer: 'Solar Crypto AutoTrade'
    });
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    return {
      secret: secret.base32 || '',
      otpAuthUrl: secret.otpauth_url || '',
      qrCodeUrl
    };
  }
  
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }
  
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

export const twoFactorAuth = new TwoFactorAuth();
