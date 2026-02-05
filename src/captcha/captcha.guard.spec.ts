import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaGuard } from './captcha.guard';
import { CaptchaService } from './captcha.service';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

describe('CaptchaGuard', () => {
  let guard: CaptchaGuard;
  let service: CaptchaService;

  const mockCaptchaService = {
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptchaGuard,
        {
          provide: CaptchaService,
          useValue: mockCaptchaService,
        },
      ],
    }).compile();

    guard = module.get<CaptchaGuard>(CaptchaGuard);
    service = module.get<CaptchaService>(CaptchaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('Token Extraction', () => {
    it('should extract token from X-Captcha-Token header', async () => {
      const mockRequest = {
        headers: { 'x-captcha-token': 'test-token' },
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({ success: true });

      await guard.canActivate(mockContext);

      expect(mockCaptchaService.validateToken).toHaveBeenCalledWith(
        'test-token',
      );
    });

    it('should extract token from Authorization header', async () => {
      const mockRequest = {
        headers: { authorization: 'Captcha test-token' },
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({ success: true });

      await guard.canActivate(mockContext);

      expect(mockCaptchaService.validateToken).toHaveBeenCalledWith(
        'test-token',
      );
    });

    it('should extract token from request body', async () => {
      const mockRequest = {
        headers: {},
        body: { captchaToken: 'test-token' },
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({ success: true });

      await guard.canActivate(mockContext);

      expect(mockCaptchaService.validateToken).toHaveBeenCalledWith(
        'test-token',
      );
    });

    it('should extract token from query parameters', async () => {
      const mockRequest = {
        headers: {},
        body: {},
        query: { captchaToken: 'test-token' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({ success: true });

      await guard.canActivate(mockContext);

      expect(mockCaptchaService.validateToken).toHaveBeenCalledWith(
        'test-token',
      );
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const mockRequest = {
        headers: {},
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Validation', () => {
    it('should allow request when validation succeeds', async () => {
      const mockRequest = {
        headers: { 'x-captcha-token': 'valid-token' },
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({
        success: true,
        score: 0.9,
        action: 'login',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest['captchaToken']).toBe('valid-token');
      expect(mockRequest['captchaValidation']).toEqual({
        success: true,
        score: 0.9,
        action: 'login',
      });
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      const mockRequest = {
        headers: { 'x-captcha-token': 'invalid-token' },
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockCaptchaService.validateToken.mockResolvedValue({
        success: false,
        message: 'Validation failed',
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
