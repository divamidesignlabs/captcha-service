import { SetMetadata } from '@nestjs/common';

/**
 * Skip CAPTCHA validation for a specific route
 * 
 * Usage:
 * @Post('public-endpoint')
 * @SkipCaptcha()
 * @UseCaptchaGuard()
 * publicEndpoint() {
 *   return { message: 'No captcha needed' };
 * }
 */
export const SKIP_CAPTCHA_KEY = 'skipCaptcha';
export const SkipCaptcha = () => SetMetadata(SKIP_CAPTCHA_KEY, true);
