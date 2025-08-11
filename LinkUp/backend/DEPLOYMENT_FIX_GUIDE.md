# 🚨 DEPLOYMENT FIX: Password Reset Not Working

## The Problem
Your password reset works on localhost but fails on deployment because the reset email contains `localhost:5173` URLs instead of your production frontend URL.

## 🔧 Solution: Set Correct Environment Variables

### For Render Deployment:
1. Go to your Render backend service dashboard
2. Navigate to "Environment" tab
3. Add/Update these variables:

```bash
# Critical - This is likely missing or wrong
FRONTEND_URL=https://linkup-frontend-voty.onrender.com

# Email configuration (should already be set)
EMAIL_USER=rakeshedu48@gmail.com
EMAIL_PASS=your_16_character_app_password

# Environment
NODE_ENV=production
```

### For Vercel/Netlify:
```bash
FRONTEND_URL=https://your-app-name.vercel.app
# or
FRONTEND_URL=https://your-app-name.netlify.app
```

### For Heroku:
```bash
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com
```

## 🧪 How to Test:

### 1. Check Current Configuration:
Visit: `https://your-backend-url.onrender.com/api/email-config`

### 2. Test Reset Password:
1. Deploy with correct FRONTEND_URL
2. Use forgot password feature on production
3. Check email - the reset link should be: `https://linkup-frontend-voty.onrender.com/reset-password?token=...`

NOT: `http://localhost:5173/reset-password?token=...`

## 🔍 Debug Logs:
After setting FRONTEND_URL, check your backend logs for:
```
🔧 FORGOT PASSWORD DEBUG:
- FRONTEND_URL: https://linkup-frontend-voty.onrender.com ✅

🔧 RESET PASSWORD EMAIL DEBUG:
- Full reset URL: https://linkup-frontend-voty.onrender.com/reset-password?token=...
```

## ✅ Expected Behavior:
1. User requests password reset on production
2. Backend sends email with production frontend URL
3. User clicks link → goes to production frontend reset page
4. Password reset works ✅

## 🚨 Common Mistakes:
- ❌ FRONTEND_URL not set in production
- ❌ FRONTEND_URL points to localhost
- ❌ Wrong frontend domain
- ❌ HTTP instead of HTTPS
- ❌ Trailing slash in URL

## 📧 Example Reset Email:
The reset button should link to:
```
https://linkup-frontend-voty.onrender.com/reset-password?token=abc123...
```

## 🔗 Quick Fix:
Set this exact environment variable on Render:
```
FRONTEND_URL=https://linkup-frontend-voty.onrender.com
```

Then redeploy and test!
