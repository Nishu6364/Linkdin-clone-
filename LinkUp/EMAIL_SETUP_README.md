# Email Setup Instructions for LinkUp

This guide will help you set up email functionality for user registration confirmation and password reset features.

## Prerequisites

1. A Gmail account for sending emails
2. App-specific password for Gmail (required for security)

## Gmail Setup

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Navigate to Security
- Enable 2-Step Verification if not already enabled

### 2. Generate App-Specific Password
- In Google Account settings, go to Security
- Under "2-Step Verification", click on "App passwords"
- Select "Mail" as the app and your device
- Google will generate a 16-character password
- Copy this password (you'll need it for EMAIL_PASS)

## Backend Configuration

### 1. Create .env file
Create a `.env` file in the `LinkUp/backend` directory with the following variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/linkup

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Environment
NODE_ENVIRONMENT=development

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Replace with your actual values:
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: The 16-character app-specific password from Gmail
- `JWT_SECRET`: A secure random string for JWT token generation
- `FRONTEND_URL`: Your frontend URL (keep as localhost:5173 for development)

## Features Implemented

### 1. Welcome Email on Registration
- Users receive a welcome email upon successful registration
- Email includes personalized greeting and platform overview
- Professional HTML template with company branding

### 2. Forgot Password
- Users can request password reset from login page
- Reset link sent to registered email address
- Reset token expires after 1 hour for security

### 3. Reset Password
- Secure password reset using tokens
- Password validation (minimum 8 characters)
- Automatic redirect to login after successful reset

## API Endpoints

### Authentication Routes
- `POST /api/auth/signup` - User registration (now sends welcome email)
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/logout` - User logout

## Frontend Routes
- `/login` - Login page (with "Forgot Password" link)
- `/forgot-password` - Request password reset
- `/reset-password?token=...` - Reset password form

## Testing the Email Functionality

### 1. Test Registration Email:
1. Start the backend server: `npm run dev`
2. Start the frontend server: `npm run dev`
3. Register a new user
4. Check your email for the welcome message

### 2. Test Password Reset:
1. Go to login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for reset link
5. Click the link and set a new password

## Security Features

- Reset tokens expire after 1 hour
- Secure token generation using crypto
- App-specific passwords for Gmail
- Input validation and sanitization
- Error handling without exposing sensitive information

## Troubleshooting

### Common Issues:

1. **"Authentication failed" error:**
   - Ensure 2FA is enabled on Gmail
   - Use app-specific password, not your regular Gmail password
   - Check EMAIL_USER and EMAIL_PASS in .env file

2. **Emails not sending:**
   - Verify Gmail credentials
   - Check if "Less secure app access" is disabled (should be)
   - Ensure app-specific password is correct

3. **Reset links not working:**
   - Check FRONTEND_URL in .env matches your frontend URL
   - Verify the token hasn't expired (1 hour limit)
   - Check browser console for JavaScript errors

## Production Deployment

For production:
1. Use a professional email service (SendGrid, AWS SES, etc.)
2. Update NODE_ENVIRONMENT to "production"
3. Set secure FRONTEND_URL to your production domain
4. Use environment variables in your hosting platform
5. Consider implementing rate limiting for email endpoints

## Alternative Email Services

If you prefer not to use Gmail, you can modify `config/email.js` to use:
- SendGrid
- AWS SES
- Mailgun
- Nodemailer with other SMTP providers

Update the transporter configuration accordingly in the email config file.
