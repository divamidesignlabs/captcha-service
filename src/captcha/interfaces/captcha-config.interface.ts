import { CaptchaProvider } from '../enums/captcha-provider.enum';

export interface CaptchaConfig {
  provider: CaptchaProvider;
  secretKey: string;
  enabled?: boolean;
  minimumScore?: number;
  verifyUrl?: string;
  projectId?: string; // Required for Google reCAPTCHA Enterprise
  apiKey?: string;    // Required for Google reCAPTCHA Enterprise
}

export interface GoogleRecaptchaConfig {
  secretKey: string;
  minimumScore?: number;
}

export interface CloudflareConfig {
  secretKey: string;
}
