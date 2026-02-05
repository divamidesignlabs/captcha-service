// Main exports
export { CaptchaModule } from './captcha/captcha.module';
export { CaptchaService } from './captcha/captcha.service';
export { CaptchaGuard } from './captcha/captcha.guard';

// Decorators
export { CaptchaToken } from './captcha/decorators/captcha-token.decorator';

// Enums
export { CaptchaProvider } from './captcha/enums/captcha-provider.enum';

// Interfaces
export type {
  CaptchaConfig,
  GoogleRecaptchaConfig,
  CloudflareConfig,
} from './captcha/interfaces/captcha-config.interface';
