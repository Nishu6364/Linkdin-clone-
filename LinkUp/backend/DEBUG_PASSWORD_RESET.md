# Password Reset Error Debugging Guide

## Error: POST /api/auth/forgot-password 500 (Internal Server Error)

This error occurs when the backend fails to process the forgot password request. Here's how to debug and fix it:

## 🔍 Step 1: Check Production Environment Variables

Ensure these environment variables are set on your hosting platform (Render, Heroku, etc.):

### Required Variables:
```bash
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password  # NOT your regular Gmail password!
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENVIRONMENT=production
NODE_ENV=production
```

### Where to set them:

**On Render:**
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add each variable as key-value pairs

**On Heroku:**
1. Go to your app dashboard
2. Navigate to "Settings" → "Config Vars"
3. Add each variable

**On Vercel/Netlify:**
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add each variable

## 🔍 Step 2: Gmail App-Specific Password Setup

The most common cause is using a regular Gmail password instead of an App-Specific Password.

### Generate App-Specific Password:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled
4. Under "2-Step Verification", click "App passwords"
5. Select "Mail" as the app type
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
7. Use this as your `EMAIL_PASS` (remove spaces: `abcdefghijklmnop`)

## 🔍 Step 3: Test Email Configuration Locally

Run this command in your backend directory to test email configuration:

```bash
node test-email-debug.js
```

This will tell you exactly what's wrong with your email setup.

## 🔍 Step 4: Check Server Logs

Look at your production server logs for these error messages:

### Common Error Messages and Solutions:

**"Email configuration missing"**
- Solution: Set EMAIL_USER and EMAIL_PASS environment variables

**"Authentication failed" (Code: EAUTH)**
- Solution: Use App-Specific Password, not regular Gmail password
- Ensure 2FA is enabled on Gmail

**"Connection timeout" (Code: ECONNECTION)**
- Solution: Check if your hosting platform blocks SMTP connections
- Try using a different email service (SendGrid, Mailgun)

**"Invalid login" (Code: 535)**
- Solution: Double-check your Gmail credentials
- Make sure "Less secure app access" is not needed (use App Password instead)

## 🔍 Step 5: Frontend URL Configuration

Make sure `FRONTEND_URL` matches your actual frontend domain:

```bash
# For production
FRONTEND_URL=https://your-frontend-domain.com

# For local testing
FRONTEND_URL=http://localhost:5173
```

## 🔍 Step 6: Alternative Email Services

If Gmail continues to cause issues, consider switching to:

### SendGrid:
```javascript
const transporter = nodemailer.createTransporter({
    service: 'SendGrid',
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});
```

### Mailgun:
```javascript
const transporter = nodemailer.createTransporter({
    service: 'Mailgun',
    auth: {
        user: process.env.MAILGUN_USERNAME,
        pass: process.env.MAILGUN_PASSWORD
    }
});
```

## 🚀 Quick Fix Checklist:

- [ ] Set all required environment variables on production
- [ ] Use Gmail App-Specific Password (16 characters)
- [ ] Enable 2FA on Gmail account
- [ ] Set correct FRONTEND_URL
- [ ] Test email configuration locally
- [ ] Check production server logs
- [ ] Redeploy after environment variable changes

## 📝 Testing Commands:

```bash
# Test email configuration
node test-email-debug.js

# Check environment variables (locally)
echo $EMAIL_USER
echo $EMAIL_PASS
echo $FRONTEND_URL

# Test forgot password endpoint (replace URL)
curl -X POST https://your-backend-url.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🆘 Still Not Working?

1. Check if your hosting platform supports SMTP connections
2. Try using a different email service (SendGrid, Mailgun)
3. Check firewall/security settings on your hosting platform
4. Contact your hosting provider's support

## 📊 Success Indicators:

- Server logs show: "Email server is ready to send messages"
- Server logs show: "Reset email sent successfully to: [email]"
- User receives password reset email
- Password reset link works correctly
