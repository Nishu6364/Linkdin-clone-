# Authentication 401 Error Fix Guide

## Error: GET /api/user/currentuser 401 (Unauthorized)

This error occurs when the backend can't authenticate the user request. Here's how to debug and fix it:

## 🔍 Root Cause Analysis

The 401 error is typically caused by:
1. **Missing cookies** in cross-origin requests
2. **Incorrect CORS configuration** 
3. **Wrong cookie settings** for production
4. **Frontend not sending credentials**

## 🚀 Backend Fixes Applied

### 1. **Enhanced CORS Configuration**
Added proper headers for cookie handling:
```javascript
allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
exposedHeaders: ["Set-Cookie"]
```

### 2. **Fixed Cookie Configuration**
Updated cookie settings for cross-origin production:
```javascript
sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
secure: process.env.NODE_ENV === "production",
domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
```

### 3. **Enhanced Debug Logging**
Added detailed logging in auth middleware to track the issue.

## 🖥️ Frontend Configuration Required

Make sure your frontend is properly configured to send credentials:

### **Axios Configuration (if using Axios):**
```javascript
// In your API setup file
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://linkup-backend-blwa.onrender.com/api',
  withCredentials: true, // CRITICAL: This sends cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;
```

### **Fetch Configuration (if using fetch):**
```javascript
fetch('https://linkup-backend-blwa.onrender.com/api/user/currentuser', {
  method: 'GET',
  credentials: 'include', // CRITICAL: This sends cookies
  headers: {
    'Content-Type': 'application/json',
  }
})
```

## 🛠️ Environment Variables Required

Add these to your production environment:
```bash
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://linkup-frontend-voty.onrender.com
```

## 🧪 Testing Steps

### 1. **Test Health Endpoint**
```bash
curl https://linkup-backend-blwa.onrender.com/api/health
```

### 2. **Test Login Process**
1. Login from your frontend
2. Check browser DevTools → Application → Cookies
3. Verify "token" cookie is set with correct attributes:
   - `HttpOnly: true`
   - `Secure: true` (in production)
   - `SameSite: None` (in production)

### 3. **Test Current User Endpoint**
```bash
# With cookie (replace YOUR_TOKEN with actual token)
curl https://linkup-backend-blwa.onrender.com/api/user/currentuser \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Origin: https://linkup-frontend-voty.onrender.com"
```

## 🔍 Debugging Commands

### **Check Server Logs:**
Look for these log messages:
- "Auth middleware - Cookies received: {...}"
- "Auth middleware - Origin: https://..."
- "Auth middleware - No token found in cookies"

### **Browser DevTools:**
1. **Network Tab**: Check if requests include "Cookie" header
2. **Application Tab**: Verify cookie is set after login
3. **Console**: Look for CORS errors

## 🚨 Common Issues & Solutions

### **Issue: Cookie not being sent**
**Solution:** Add `withCredentials: true` to your frontend API calls

### **Issue: CORS errors**
**Solution:** Verify frontend URL is in allowed origins list

### **Issue: Cookie not setting after login**
**Solution:** Check if login response includes `Set-Cookie` header

### **Issue: Token expired**
**Solution:** Re-login to get fresh token

## 📋 Quick Checklist

- [ ] Frontend sends `withCredentials: true` or `credentials: 'include'`
- [ ] Backend has proper CORS with `credentials: true`
- [ ] Cookie settings correct for production environment
- [ ] `NODE_ENV=production` set on production server
- [ ] JWT_SECRET environment variable set
- [ ] Login process sets cookie properly
- [ ] Browser allows third-party cookies (for cross-origin)

## 🎯 Expected Behavior After Fix

1. **Login**: Should set secure cookie with proper attributes
2. **Current User**: Should successfully authenticate using cookie
3. **All Protected Routes**: Should work with cookie authentication

## 🆘 If Still Not Working

1. Check if your hosting platform supports cookies
2. Try using localStorage + Authorization header instead of cookies
3. Verify browser privacy settings allow third-party cookies
4. Test with same-origin setup first (both frontend and backend on same domain)
