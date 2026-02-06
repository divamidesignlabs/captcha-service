import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaptchaService } from './captcha.service';
import { SKIP_CAPTCHA_KEY } from './decorators/skip-captcha.decorator';

@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(
    private readonly captchaService: CaptchaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route has @SkipCaptcha() decorator
    const skipCaptcha = this.reflector.getAllAndOverride<boolean>(
      SKIP_CAPTCHA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCaptcha) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract token from header or body only
    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromBody(request);

    if (!token) {
      throw new UnauthorizedException(
        'Captcha token is required. Provide it in header (X-Captcha-Token or Authorization: Captcha <token>) or body (captchaToken)',
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
