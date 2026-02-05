import { CaptchaProvider } from '../enums/captcha-provider.enum';

export interface CaptchaConfig {
  provider: CaptchaProvider;
  secretKey: string;
  minimumScore?: number;
  verifyUrl?: string; 
}

export interface GoogleRecaptchaConfig {
  secretKey: string;
  minimumScore?: number;
}

export interface CloudflareConfig {
  secretKey: string;
}
