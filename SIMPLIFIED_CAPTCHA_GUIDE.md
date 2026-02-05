# 🛡️ Simple CAPTCHA Module - Quick Guide

## What You Need

Just 3 things:
1. **Provider Name** (Google reCAPTCHA v3 or Cloudflare Turnstile)
2. **Secret Key** (from provider - for backend)
3. **Site Key** (from provider - for frontend)

---

## Setup (3 Steps)

### Step 1: Add to `.env`

**For Google reCAPTCHA v3:**
```env
CAPTCHA_PROVIDER=google-recaptcha-v3
CAPTCHA_SECRET_KEY=your_secret_key_here
CAPTCHA_MINIMUM_SCORE=0.5
```

**For Cloudflare Turnstile:**
```env
CAPTCHA_PROVIDER=cloudflare-turnstile
CAPTCHA_SECRET_KEY=your_secret_key_here
```

### Step 2: Protect Your Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { CaptchaGuard } from './captcha';

@Post('login')
@UseGuards(CaptchaGuard)  // ← Add this
async login(@Body() dto: LoginDto) {
  return { success: true };
}
```

### Step 3: Send Token from Frontend

```javascript
// Get token from provider
const token = await grecaptcha.execute('YOUR_SITE_KEY', { action: 'login' });

// Send to backend in header
fetch('/login', {
  headers: { 'X-Captcha-Token': token }
});
```

---

## Get Your Keys

### Google reCAPTCHA v3
1. Visit: https://www.google.com/recaptcha/admin
2. Create new site (select v3)
3. Copy **Secret Key** → Backend `.env`
4. Copy **Site Key** → Frontend code

### Cloudflare Turnstile
1. Visit: https://dash.cloudflare.com/ → Turnstile
2. Create new site
3. Copy **Secret Key** → Backend `.env`
4. Copy **Site Key** → Frontend code

**Test Keys (Cloudflare only):**
```
Site Key: 1x00000000000000000000AA
Secret Key: 1x0000000000000000000000000000000AA
```

---

## How It Works

1. Frontend generates token from provider
2. Frontend sends token to your API
3. Guard extracts token
4. Service validates with provider
5. If valid → request proceeds
6. If invalid → returns 401 error

**That's it!** No IP checking, no extra tracking, just simple token validation.

---

## Send Token (3 Ways)

### Way 1: Header (Recommended)
```javascript
fetch('/api/endpoint', {
  headers: { 'X-Captcha-Token': token }
});
```

### Way 2: Body
```javascript
fetch('/api/endpoint', {
  body: JSON.stringify({ captchaToken: token })
});
```

### Way 3: Query
```javascript
fetch('/api/endpoint?captchaToken=' + token);
```

---

## Frontend Integration

### Google reCAPTCHA v3
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
<script>
  grecaptcha.ready(async () => {
    const token = await grecaptcha.execute('YOUR_SITE_KEY', { 
      action: 'login' 
    });
    // Send token to backend
  });
</script>
```

### Cloudflare Turnstile
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
<div class="cf-turnstile" 
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onSuccess">
</div>
<script>
  function onSuccess(token) {
    // Send token to backend
  }
</script>
```

---

## What's Included

✅ Token validation with provider  
✅ Google reCAPTCHA v3 support  
✅ Cloudflare Turnstile support  
✅ Score checking (Google only)  
✅ Simple guard for route protection  
✅ Three ways to send token  

❌ No IP checking  
❌ No failed attempt tracking  
❌ No suspicious activity detection  

**Keep it simple!** Just validate tokens with your chosen provider.

---

## Environment Variables

```env
# Required
CAPTCHA_PROVIDER=google-recaptcha-v3        # or cloudflare-turnstile
CAPTCHA_SECRET_KEY=your_secret_key          # from provider

# Optional (Google only)
CAPTCHA_MINIMUM_SCORE=0.5                   # default: 0.5 (0.0 to 1.0)
```

---

## Example Usage

```typescript
// Simple route protection
@Post('login')
@UseGuards(CaptchaGuard)
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// Protect multiple routes
@Controller('auth')
@UseGuards(CaptchaGuard)
export class AuthController {
  @Post('login') login() {}
  @Post('register') register() {}
}

// Access token in controller
import { CaptchaToken } from './captcha';

@Post('login')
@UseGuards(CaptchaGuard)
async login(@CaptchaToken() token: string) {
  console.log('Token:', token);
}
```

---

## Testing

```bash
# Test with Postman/curl
curl -X POST http://localhost:3000/example/protected-route \
  -H "X-Captcha-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Error Responses

**No token:**
```json
{
  "statusCode": 401,
  "message": "Captcha token is required"
}
```

**Invalid token:**
```json
{
  "statusCode": 401,
  "message": "Captcha validation failed"
}
```

---

## That's It!

Simple CAPTCHA validation - no complexity, just:
1. Choose provider
2. Add keys to `.env`
3. Use `@UseGuards(CaptchaGuard)`
4. Send token from frontend

**Done!** 🎉
