# 🎯 reCAPTCHA v3 Quick Reference

## ⚡ Quick Setup (3 Steps)

```bash
# 1. Get API Keys
Visit: https://www.google.com/recaptcha/admin
Choose: reCAPTCHA v3

# 2. Configure Environment
cp .env.example .env
# Add your RECAPTCHA_V3_SECRET_KEY

# 3. Start Server
npm run start:dev
```

---

## 📋 Environment Variables

```env
CAPTCHA_DEFAULT_PROVIDER=recaptcha-v3
RECAPTCHA_V3_SECRET_KEY=6Lf...your_secret_key
RECAPTCHA_V3_SCORE_THRESHOLD=0.5        # 0.0-1.0
RECAPTCHA_V3_VERIFY_ACTION=true         # true/false
CAPTCHA_FAILED_LOGIN_THRESHOLD=3        # number of attempts
```

---

## 🎨 Frontend Integration

```html
<!-- 1. Add Script -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<!-- 2. Execute on Submit -->
<script>
function onSubmit(e) {
  e.preventDefault();
  grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_SITE_KEY', {action: 'login'})
      .then(function(token) {
        // Add token to form
        document.getElementById('captchaToken').value = token;
        form.submit();
      });
  });
}
</script>
```

---

## 🔌 API Endpoints

### POST /auth/login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "captchaToken": "03AGdBq27..."
  }'
```

### POST /auth/signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@example.com",
    "password": "password123",
    "name": "John Doe",
    "captchaToken": "03AGdBq27..."
  }'
```

### POST /auth/forgot-password

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "captchaToken": "03AGdBq27..."
  }'
```

---

## 📊 Score Interpretation

| Score  | Meaning | Action |
|--------|---------|--------|
| 0.9-1.0 | Human | ✅ Allow |
| 0.7-0.8 | Likely human | ✅ Allow |
| 0.5-0.6 | Neutral | ✅ Allow (default threshold) |
| 0.3-0.4 | Suspicious | ⚠️ Review |
| 0.0-0.2 | Bot | ❌ Block |

---

## 📝 Response Examples

### Success (No CAPTCHA)
```json
{
  "accessToken": "jwt_token",
  "user": { "id": "123", "email": "user@example.com" }
}
```

### CAPTCHA Required
```json
{
  "message": "CAPTCHA verification required",
  "captchaRequired": true,
  "provider": "recaptcha-v3",
  "type": "invisible"
}
```

### Verification Failed
```json
{
  "message": "CAPTCHA verification failed",
  "score": 0.3,
  "errors": []
}
```

---

## 🔧 Common Configuration Tweaks

### Make More Lenient
```env
RECAPTCHA_V3_SCORE_THRESHOLD=0.3  # Allow more traffic
```

### Make More Strict
```env
RECAPTCHA_V3_SCORE_THRESHOLD=0.7  # Block more bots
```

### Disable Action Verification (Testing)
```env
RECAPTCHA_V3_VERIFY_ACTION=false
```

### Change Failed Attempt Threshold
```env
CAPTCHA_FAILED_LOGIN_THRESHOLD=5  # Require CAPTCHA after 5 fails
```

---

## 🐛 Troubleshooting

### Score Always 0.0
- ✅ Check: Using correct keys for environment
- ✅ Check: Domain registered in reCAPTCHA admin
- ✅ Check: Not using test keys in production

### Action Mismatch
- ✅ Check: Frontend action matches backend expectedAction
- ✅ Example: `{action: 'login'}` → `expectedAction: 'login'`

### Token Expired
- ✅ Generate token immediately before submission
- ✅ Tokens expire after ~2 minutes

### Verification Always Fails
- ✅ Check: `RECAPTCHA_V3_SECRET_KEY` in `.env`
- ✅ Check: Secret key is correct (not site key)
- ✅ Check: No extra spaces in key

---

## 📈 Monitoring Tips

Watch logs for:
```
[RecaptchaV3Service] reCAPTCHA v3 verified: true (score: 0.9, action: login, threshold: 0.5)
[AuthController] CAPTCHA verified for user@example.com (score: 0.9)
```

Track:
- Average scores
- Verification failure rate
- Action mismatch frequency
- Low score patterns

---

## 🔒 Security Checklist

- [ ] Secret key in `.env` (not in code)
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enabled in production
- [ ] Action verification enabled
- [ ] Score threshold appropriate for your app
- [ ] Monitoring and logging enabled
- [ ] Rate limiting configured
- [ ] Failed attempt tracking active

---

## 📚 Documentation

- **Full Guide**: [RECAPTCHA_V3_GUIDE.md](RECAPTCHA_V3_GUIDE.md)
- **Status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- **Main Docs**: [CAPTCHA_SYSTEM_INDEX.md](CAPTCHA_SYSTEM_INDEX.md)

---

## 🎯 Next Steps

1. ✅ Test with your frontend
2. ✅ Monitor score distribution
3. ✅ Adjust threshold if needed
4. 🚧 Add Cloudflare Turnstile (Phase 2)
5. 🚧 Add reCAPTCHA v2 fallback (Phase 3)

---

**Quick Help**: If stuck, check [RECAPTCHA_V3_GUIDE.md](RECAPTCHA_V3_GUIDE.md) for detailed troubleshooting!
