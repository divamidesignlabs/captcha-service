import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { CaptchaProvider } from './enums/captcha-provider.enum';

describe('CaptchaService', () => {
  let service: CaptchaService;

  describe('Google reCAPTCHA v3', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CaptchaService,
          {
            provide: 'CAPTCHA_CONFIG',
            useValue: {
              provider: CaptchaProvider.GOOGLE_RECAPTCHA_V3,
              secretKey: 'test-secret-key',
              minimumScore: 0.5,
            },
          },
        ],
      }).compile();

      service = module.get<CaptchaService>(CaptchaService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return the configured provider', () => {
      expect(service.getProvider()).toBe(CaptchaProvider.GOOGLE_RECAPTCHA_V3);
    });

    it('should return the configured minimum score', () => {
      expect(service.getMinimumScore()).toBe(0.5);
    });

    it('should fail validation when token is empty', async () => {
      const result = await service.validateToken('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Captcha token is required');
    });

    it('should handle validation errors gracefully', async () => {
      const result = await service.validateToken('invalid-token');
      // Note: This will make actual API call and fail
      expect(result.success).toBe(false);
    });
  });

  describe('Cloudflare Turnstile', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CaptchaService,
          {
            provide: 'CAPTCHA_CONFIG',
            useValue: {
              provider: CaptchaProvider.CLOUDFLARE_TURNSTILE,
              secretKey: 'test-secret-key',
            },
          },
        ],
      }).compile();

      service = module.get<CaptchaService>(CaptchaService);
    });

    it('should return the configured provider', () => {
      expect(service.getProvider()).toBe(
        CaptchaProvider.CLOUDFLARE_TURNSTILE,
      );
    });

    it('should fail validation when token is empty', async () => {
      const result = await service.validateToken('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Captcha token is required');
    });
  });
});
