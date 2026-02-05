import { Injectable, Inject, Logger } from '@nestjs/common';
import { CaptchaProvider } from './enums/captcha-provider.enum';
import {
  CaptchaValidationResponse,
  GoogleRecaptchaResponse,
  CloudflareResponse,
} from './interfaces/captcha-response.interface';
import type { CaptchaConfig } from './interfaces/captcha-config.interface';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly GOOGLE_VERIFY_URL =
    'https://www.google.com/recaptcha/api/siteverify';
  private readonly CLOUDFLARE_VERIFY_URL =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(
    @Inject('CAPTCHA_CONFIG')
    private readonly config: CaptchaConfig,
  ) {}

  /**
   * Validates the captcha token based on the configured provider
   * @param token - The captcha token from the frontend
   * @returns Validation response with success status and additional info
   */
  async validateToken(token: string): Promise<CaptchaValidationResponse> {
    if (!token) {
      return {
        success: false,
        message: 'Captcha token is required',
      };
    }

    console.log('Using Captcha Provider:', this.config.provider);
if (!this.config.secretKey) {
  return {
    success: false,
    message: 'Captcha secret key not configured',
  };
}

    try {
      switch (this.config.provider) {
        case CaptchaProvider.GOOGLE_RECAPTCHA_V3:
          return await this.validateGoogleRecaptcha(token);
        case CaptchaProvider.CLOUDFLARE_TURNSTILE:
          return await this.validateCloudflareTurnstile(token);
        default:
          throw new Error(`Unsupported captcha provider: ${this.config.provider}`);
      }
    } catch (error) {
      this.logger.error('Captcha validation error:', error);
      return {
        success: false,
        message: 'Failed to validate captcha',
        errors: [error.message],
      };
    }
  }

  /**
   * Validates Google reCAPTCHA v3 token
   */
private async validateGoogleRecaptcha(
  token: string,
): Promise<CaptchaValidationResponse> {
  const verifyUrl = this.config.verifyUrl || this.GOOGLE_VERIFY_URL;
  const params = new URLSearchParams({
    secret: this.config.secretKey,
    response: token,
  });

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data: GoogleRecaptchaResponse = await response.json();
  this.logger.log('Google reCAPTCHA Response:', data);

  const minimumScore = this.config.minimumScore ?? 0.5;
  const scoreValid = data.score >= minimumScore;

  if (!data.success) {
    this.logger.warn('Google reCAPTCHA validation failed', { errors: data['error-codes'] });
  } else if (!scoreValid) {
    this.logger.warn(`Google reCAPTCHA score ${data.score} below minimum ${minimumScore}`);
  }

  return {
    success: data.success && scoreValid,
    score: data.score,
    action: data.action,
    challenge_ts: data.challenge_ts,
    hostname: data.hostname,
    'error-codes': data['error-codes'],
    message:
      data.success && scoreValid
        ? 'Captcha validated successfully'
        : `Validation failed${!scoreValid ? ': score too low' : ''}`,
  };
}


  /**
   * Validates Cloudflare Turnstile token
   */
  private async validateCloudflareTurnstile(
    token: string,
  ): Promise<CaptchaValidationResponse> {
    const verifyUrl = this.config.verifyUrl || this.CLOUDFLARE_VERIFY_URL;

    const body = {
      secret: this.config.secretKey,
      response: token,
    };

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: CloudflareResponse = await response.json();

    if (!data.success) {
      this.logger.warn('Cloudflare Turnstile validation failed', {
        errors: data['error-codes'],
      });
    }

    return {
      success: data.success,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      action: data.action,
      'error-codes': data['error-codes'],
      message: data.success
        ? 'Captcha validated successfully'
        : 'Validation failed',
    };
  }

  /**
   * Get the current captcha provider
   */
  getProvider(): CaptchaProvider {
    return this.config.provider;
  }

  /**
   * Get the configured minimum score (for Google reCAPTCHA v3)
   */
  getMinimumScore(): number | undefined {
    return this.config.minimumScore;
  }
}
