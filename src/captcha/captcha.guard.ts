import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { type CaptchaConfig } from './interfaces/captcha-config.interface';

@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(
    private readonly captchaService: CaptchaService,
    @Inject('CAPTCHA_CONFIG') private readonly config: CaptchaConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if captcha is enabled in configuration (default: true)
    if (this.config.enabled === false) {
      return true;
    }
   
    const request = context.switchToHttp().getRequest();

    // Extract token from header or body only
    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromBody(request);

    if (!token) {
      throw new UnauthorizedException(
        'Captcha token is required. Provide it in header (X-Captcha-Token) or body (captchaToken)',
      );
    }

    // Validate the token
    const validationResult = await this.captchaService.validateToken(token);

    if (!validationResult.success) {
      throw new UnauthorizedException(
        validationResult.message || 'Captcha validation failed',
      );
    }

    // Attach token and validation result to request for later use
    request.captchaToken = token;
    request.captchaValidation = validationResult;

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


    return null;
  }

  /**
   * Extract token from request body
   */
  private extractTokenFromBody(request: any): string | null {
    return request.body?.captchaToken || request.body?.captcha_token || null;
  }
}
