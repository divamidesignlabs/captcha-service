import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Injectable()
export class CaptchaGuard implements CanActivate {
  private readonly logger = new Logger(CaptchaGuard.name);

  constructor(private readonly captchaService: CaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract token from different possible locations
    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromBody(request) ||
      this.extractTokenFromQuery(request);
console.log('Extracted Captcha Token:', token);
    if (!token) {
      this.logger.warn('Captcha token not found in request');
      throw new UnauthorizedException(
        'Captcha token is required. Provide it in header (X-Captcha-Token), body (captchaToken), or query (?captchaToken=...)',
      );
    }

    // Validate the token
    const validationResult = await this.captchaService.validateToken(token);

    if (!validationResult.success) {
      this.logger.warn('Captcha validation failed', {
        errors: validationResult['error-codes'] || validationResult.errors,
        score: validationResult.score,
      });

      throw new UnauthorizedException(
        validationResult.message || 'Captcha validation failed',
      );
    }

    // Attach token and validation result to request for later use
    request.captchaToken = token;
    request.captchaValidation = validationResult;

    this.logger.debug('Captcha validation successful', {
      score: validationResult.score,
      action: validationResult.action,
    });

    return true;
  }

  /**
   * Extract token from Authorization header or custom X-Captcha-Token header
   */
  private extractTokenFromHeader(request: any): string | null {
    const captchaHeader = request.headers['x-captcha-token'];
    if (captchaHeader) {
      return captchaHeader;
    }

    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Captcha ')) {
      return authHeader.substring(8);
    }

    return null;
  }

  /**
   * Extract token from request body
   */
  private extractTokenFromBody(request: any): string | null {
    return request.body?.captchaToken || request.body?.captcha_token || null;
  }

  /**
   * Extract token from query parameters
   */
  private extractTokenFromQuery(request: any): string | null {
    return request.query?.captchaToken || request.query?.captcha_token || null;
  }
}
