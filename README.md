# NestJS Captcha Module

A production-ready NestJS module for validating **Google reCAPTCHA v3** and **Cloudflare Turnstile** captcha tokens.

## Features

 **Multiple Providers**: Support for Google reCAPTCHA v3 and Cloudflare Turnstile  
 **Guard-Based Protection**: Easy-to-use `@UseGuards(CaptchaGuard)` decorator  
 **Flexible Token Extraction**: Accepts tokens from headers or request body  
 **Skip Routes**: Use `@SkipCaptcha()` decorator to bypass validation on specific routes  
 **Async Configuration**: Load config from environment variables or ConfigService  
 **Score Validation**: Configure minimum score threshold for Google reCAPTCHA v3  
 **TypeScript**: Full type safety with TypeScript support

---

## Installation

```bash
npm install @divami-labs/captcha-nestjs
```

---

## Quick Start

### 1. Import Module

```typescript
import { Module } from '@nestjs/common';
import { CaptchaModule, CaptchaProvider } from '@divami/captcha-nestjs';

@Module({
  imports: [
    CaptchaModule.register({
      provider: CaptchaProvider.GOOGLE_RECAPTCHA_V3,
      secretKey: process.env.RECAPTCHA_SECRET_KEY,
      minimumScore: 0.5, 
    }),
  ],
})
export class AppModule {}
```

### 2. Apply Guard to Routes

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CaptchaGuard } from '@divami-labs/captcha-nestjs';

@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(CaptchaGuard)
  async login(@Body() body: LoginDto) {
    // Captcha is already validated by the guard
    return this.authService.login(body);
  }
}
```

---

## Configuration

### Synchronous Configuration

```typescript
CaptchaModule.register({
  provider: CaptchaProvider.CLOUDFLARE_TURNSTILE,
  secretKey: 'your-secret-key',
  minimumScore: 0.7, // Only for Google reCAPTCHA v3
  verifyUrl: 'https://custom-verify-url.com', // Optional
})
```

### Async Configuration (Recommended)

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CaptchaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        provider: config.get('CAPTCHA_PROVIDER') as CaptchaProvider,
        secretKey: config.get('CAPTCHA_SECRET_KEY'),
        minimumScore: parseFloat(config.get('CAPTCHA_MINIMUM_SCORE') || '0.5'),
      }),
    }),
  ],
})
export class AppModule {}
```

### Environment Variables

```env
# Google reCAPTCHA v3
CAPTCHA_PROVIDER=google-v3
RECAPTCHA_SECRET_KEY=your-google-secret-key
CAPTCHA_MINIMUM_SCORE=0.5

# OR Cloudflare Turnstile
CAPTCHA_PROVIDER=cloudflare-turnstile
TURNSTILE_SECRET_KEY=your-cloudflare-secret-key
```

---

## Sending Captcha Tokens

The guard accepts tokens from **headers** or **request body** (NOT query params).

### Method 1: Custom Header (Recommended)

```typescript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Captcha-Token': 'your-captcha-token',
  },
  body: JSON.stringify({ email, password }),
});
```


### Method 2: Request Body

```typescript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    password,
    captchaToken: 'your-captcha-token', 
  }),
});
```

---

## Decorators

### `@SkipCaptcha()`

Skip captcha validation for specific routes:

```typescript
import { Controller, Get } from '@nestjs/common';
import { SkipCaptcha } from '@divami-labs/captcha-nestjs';

@Controller('public')
@UseGuards(CaptchaGuard) // Applied globally
export class PublicController {
  @Get('health')
  @SkipCaptcha() // Skip captcha for this route
  health() {
    return { status: 'ok' };
  }

  @Get('data')
  // Captcha required for this route
  getData() {
    return { data: [] };
  }
}
```

### `@CaptchaToken()`

Access the validated token in your controller:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { CaptchaGuard, CaptchaToken } from '@divami-labs/captcha-nestjs';

@Controller('auth')
export class AuthController {
  @Post('register')
  @UseGuards(CaptchaGuard)
  async register(@CaptchaToken() token: string) {
    console.log('Validated captcha token:', token);
    // Your registration logic
  }
}
```

---

## Global Guard Setup

Apply captcha validation globally to all routes:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CaptchaGuard, CaptchaModule } from '@divami-labs/captcha-nestjs';

@Module({
  imports: [CaptchaModule.register({ /* config */ })],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaptchaGuard,
    },
  ],
})
export class AppModule {}
```

Then use `@SkipCaptcha()` on public routes.

---

## Providers

### Google reCAPTCHA v3

```typescript
CaptchaModule.register({
  provider: CaptchaProvider.GOOGLE_RECAPTCHA_V3,
  secretKey: 'your-google-secret-key',
  minimumScore: 0.5, // 0.0 (bot) to 1.0 (human)
})
```

- **Score Range**: 0.0 (likely bot) to 1.0 (likely human)
- **Recommended Minimum**: 0.5 (configurable)
- **Invisible**: No user interaction required

### Cloudflare Turnstile

```typescript
CaptchaModule.register({
  provider: CaptchaProvider.CLOUDFLARE_TURNSTILE,
  secretKey: 'your-cloudflare-secret-key',
})
```

- **Modes**: Invisible or checkbox (configured on frontend)
- **No Score**: Binary pass/fail validation

---

## API Reference

### `CaptchaService`

Injectable service for manual captcha validation:

```typescript
import { Injectable } from '@nestjs/common';
import { CaptchaService } from '@divami-labs/captcha-nestjs';

@Injectable()
export class MyService {
  constructor(private captchaService: CaptchaService) {}

  async validateCaptcha(token: string) {
    const result = await this.captchaService.validateToken(token);
    
    if (result.success) {
      console.log('Score:', result.score); // Google reCAPTCHA v3 only
      console.log('Action:', result.action);
    } else {
      console.error('Validation failed:', result.message);
    }
    
    return result;
  }
}
```

#### Methods

- `validateToken(token: string): Promise<CaptchaValidationResponse>`
- `getProvider(): CaptchaProvider`
- `getMinimumScore(): number | undefined`

---

## Error Handling

The guard throws `UnauthorizedException` when:

- Token is missing
- Token validation fails
- Score is below minimum threshold (Google reCAPTCHA v3)

```typescript
{
  "statusCode": 401,
  "message": "Captcha token is required. Provide it in header (X-Captcha-Token or Authorization: Captcha <token>) or body (captchaToken)",
  "error": "Unauthorized"
}
```

---

## Testing

### Skip Captcha in Tests

```typescript
import { Test } from '@nestjs/testing';
import { CaptchaModule, CaptchaProvider } from '@divami-labs/captcha-nestjs';

const moduleRef = await Test.createTestingModule({
  imports: [
    CaptchaModule.register({
      provider: CaptchaProvider.GOOGLE_RECAPTCHA_V3,
      secretKey: 'test-key',
    }),
  ],
  controllers: [AuthController],
})
  .overrideGuard(CaptchaGuard)
  .useValue({ canActivate: () => true }) // Mock guard
  .compile();
```

---

## TypeScript Types

```typescript
import type { CaptchaConfig, CaptchaValidationResponse } from '@divami-labs/captcha-nestjs';

const config: CaptchaConfig = {
  provider: CaptchaProvider.GOOGLE_RECAPTCHA_V3,
  secretKey: 'key',
  minimumScore: 0.5,
};

const response: CaptchaValidationResponse = {
  success: true,
  score: 0.9,
  action: 'login',
  challenge_ts: '2026-02-05T12:00:00Z',
  hostname: 'example.com',
};
```

---

## License

MIT

---

## Support

- **Google reCAPTCHA v3**: [Documentation](https://developers.google.com/recaptcha/docs/v3)
- **Cloudflare Turnstile**: [Documentation](https://developers.cloudflare.com/turnstile/)
