import { Injectable, Inject } from '@nestjs/common';
import { CaptchaProvider } from './enums/captcha-provider.enum';
import {
  CaptchaValidationResponse,
  GoogleRecaptchaResponse,
  CloudflareResponse,
} from './interfaces/captcha-response.interface';
import type { CaptchaConfig } from './interfaces/captcha-config.interface';
import { expirationCodes } from './Constants';

@Injectable()
export class CaptchaService {
  private readonly GOOGLE_VERIFY_URL =
    'https://www.google.com/recaptcha/api/siteverify';
  private readonly CLOUDFLARE_VERIFY_URL =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  private readonly GOOGLE_ENTERPRISE_VERIFY_URL =
    'https://recaptchaenterprise.googleapis.com/v1';

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
        message: 'Captcha token is required.',
      };
    }

    if (!this.config.secretKey) {
      return {
        success: false,
        message: 'Captcha secret key not configured.',
      };
    }

    try {
      switch (this.config.provider) {
        case CaptchaProvider.GOOGLE_RECAPTCHA_V2:
          return await this.validateGoogleRecaptchaV2(token);
        case CaptchaProvider.GOOGLE_RECAPTCHA_V3:
          return await this.validateGoogleRecaptcha(token);
        case CaptchaProvider.GOOGLE_RECAPTCHA_V2_ENTERPRISE:
          return await this.validateGoogleRecaptchaV2Enterprise(token);
        case CaptchaProvider.GOOGLE_RECAPTCHA_V3_ENTERPRISE:
          return await this.validateGoogleRecaptchaV3Enterprise(token);
        case CaptchaProvider.CLOUDFLARE_TURNSTILE:
          return await this.validateCloudflareTurnstile(token);
        default:
          throw new Error(`Unsupported captcha provider: ${this.config.provider}`);
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate captcha.',
        errors: [error.message],
      };
    }
  }

  /**
   * Validates Google reCAPTCHA v2 token (visible checkbox challenges)
   */
  private async validateGoogleRecaptchaV2(
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

    // Check if validation was unsuccessful
    if (!data.success) {
      // Check if token is expired
      if (this.isTokenExpired(data['error-codes'])) {
        return {
          success: false,
          'error-codes': data['error-codes'],
          message: 'Captcha expired. Please try again.',
        };
      }
      
      return {
        success: false,
        'error-codes': data['error-codes'],
        message: 'Captcha validation failed.',
      };
    }

    // v2 doesn't have a score, just success/fail
    return {
      success: true,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      'error-codes': data['error-codes'],
      message: 'Captcha validated successfully.',
    };
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

  // Check if validation was unsuccessful first
  if (!data.success) {
    // Check if token is expired
    if (this.isTokenExpired(data['error-codes'])) {
      return {
        success: false,
        'error-codes': data['error-codes'],
        message: 'Captcha expired. Please try again.',
      };
    }
    
    return {
      success: false,
      'error-codes': data['error-codes'],
      message: 'Captcha validation failed.',
    };
  }

  // If successful, validate score
  const minimumScore = this.config.minimumScore ?? 0.5;
  const scoreValid = data.score >= minimumScore;

  return {
    success: scoreValid,
    score: data.score,
    action: data.action,
    challenge_ts: data.challenge_ts,
    hostname: data.hostname,
    'error-codes': data['error-codes'],
    message:
      scoreValid
        ? 'Captcha validated successfully.'
        : 'Captcha validation failed: score is too low.',
  };
}


  /**
   * Validates Google reCAPTCHA v2 Enterprise token
   */
  private async validateGoogleRecaptchaV2Enterprise(
    token: string,
  ): Promise<CaptchaValidationResponse> {
    return await this.validateGoogleEnterprise(token, false);
  }

  /**
   * Validates Google reCAPTCHA v3 Enterprise token
   */
  private async validateGoogleRecaptchaV3Enterprise(
    token: string,
  ): Promise<CaptchaValidationResponse> {
    return await this.validateGoogleEnterprise(token, true);
  }

  /**
   * Common Enterprise validation logic
   */
  private async validateGoogleEnterprise(
    token: string,
    checkScore: boolean,
  ): Promise<CaptchaValidationResponse> {
    if (!this.config.projectId || !this.config.apiKey) {
      return {
        success: false,
        message: 'Google reCAPTCHA Enterprise requires projectId and apiKey.',
      };
    }

    const verifyUrl = 
      this.config.verifyUrl || 
      `${this.GOOGLE_ENTERPRISE_VERIFY_URL}/projects/${this.config.projectId}/assessments?key=${this.config.apiKey}`;

    const requestBody = {
      event: {
        token,
        siteKey: this.config.secretKey,
      },
    };

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: any = await response.json();

    // Check for API errors
    if (data.error) {
      return {
        success: false,
        message: `Enterprise validation failed: ${data.error.message}`,
        errors: [data.error.message],
      };
    }

    // Check token properties
    if (!data.tokenProperties) {
      return {
        success: false,
        message: 'Invalid Enterprise response: missing tokenProperties',
      };
    }

    const { tokenProperties, riskAnalysis } = data;

    // Verify token is valid
    if (!tokenProperties.valid) {
      return {
        success: false,
        message: tokenProperties.invalidReason || 'Token is invalid',
        'error-codes': [tokenProperties.invalidReason],
      };
    }

    // For v3 Enterprise, check the risk score
    if (checkScore && riskAnalysis) {
      const minimumScore = this.config.minimumScore ?? 0.5;
      const scoreValid = riskAnalysis.score >= minimumScore;

      return {
        success: scoreValid,
        score: riskAnalysis.score,
        action: tokenProperties.action,
        message: scoreValid
          ? 'Enterprise Captcha validated successfully.'
          : 'Enterprise Captcha validation failed: score is too low.',
      };
    }

    // For v2 Enterprise, just return success
    return {
      success: true,
      action: tokenProperties.action,
      message: 'Enterprise Captcha validated successfully.',
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

    // Check if validation was unsuccessful first
    if (!data.success) {
      // Check if token is expired
      if (this.isTokenExpired(data['error-codes'])) {
        return {
          success: false,
          'error-codes': data['error-codes'],
          message: 'Captcha expired. Please try again.',
        };
      }
      
      return {
        success: false,
        'error-codes': data['error-codes'],
        message: 'Captcha validation failed.',
      };
    }

    return {
      success: true,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      action: data.action,
      'error-codes': data['error-codes'],
      message: 'Captcha validated successfully.',
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

  /**
   * Check if error codes indicate token expiration
   */
  private isTokenExpired(errorCodes?: string[]): boolean {
    if (!errorCodes || errorCodes.length === 0) return false;
    
    
    return errorCodes.some(code => expirationCodes.includes(code));
  }
}
