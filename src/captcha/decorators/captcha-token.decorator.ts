import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract captcha token from request
 * Can be used to get the token value in your controller
 * 
 * Usage:
 * @Post('login')
 * @UseCaptchaGuard()
 * login(@CaptchaToken() token: string) {
 *   // token will contain the validated captcha token
 * }
 */
export const CaptchaToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.captchaToken;
  },
);
