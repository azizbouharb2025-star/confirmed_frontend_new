# Authentication Setup Guide

## Problem

The authentication API route was missing, causing login failures even with correct credentials.

## Solution

I've created the necessary authentication infrastructure:

### Files Created

1. **`app/api/auth/login/route.ts`** - Login API endpoint
   - Validates credentials
   - Compares bcrypt hashed passwords
   - Generates JWT tokens
   - Returns user data

2. **`lib/mongodb.ts`** - MongoDB connection helper
   - Manages database connections
   - Handles connection pooling
   - Supports development and production modes

3. **`setup_auth.sh`** / **`setup_auth.bat`** - Setup scripts
   - Installs required packages
   - Configures environment variables
   - Generates JWT secret

## Quick Setup (Ubuntu/VPS)

Run the setup script:

```bash
chmod +x setup_auth.sh
./setup_auth.sh
```

This will:
- Install `bcryptjs`, `jsonwebtoken`, `mongodb` packages
- Install TypeScript types
- Configure `.env` file with MongoDB URI and JWT secret
- Show next steps

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
npm install bcryptjs jsonwebtoken mongodb
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=confirmed_db

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

To generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 3. Restart Your Application

```bash
# Stop the current process (Ctrl+C)
# Then restart
npm run dev

# Or if using PM2
pm2 restart confirmed
```

## Login Credentials

After setup, you can login with:

| Role | Email | Password |
|------|-------|----------|
| **Shop Owner** | owner@techstore.tn | owner123 |
| Admin | admin1@confirmed.tn | admin123 |
| Operator 1 | ahmed.hassan@techstore.tn | ahmed123 |
| Operator 2 | fatima.zahra@techstore.tn | fatima123 |

## How It Works

### Login Flow

1. **User submits credentials** → Frontend sends POST to `/api/auth/login`
2. **API validates email** → Checks if user exists in MongoDB
3. **API verifies password** → Uses bcrypt to compare hashed password
4. **API generates JWT** → Creates token with user ID, email, role
5. **API returns data** → Sends user object and token to frontend
6. **Frontend stores token** → Saves in localStorage via Zustand
7. **Subsequent requests** → Include JWT token in Authorization header

### Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ User account status check (isActive)
- ✅ Password never returned in API responses
- ✅ Secure token-based authentication

## Troubleshooting

### "Cannot find module 'bcryptjs'"

**Solution**: Run the setup script or install manually:
```bash
npm install bcryptjs jsonwebtoken mongodb
```

### "MONGODB_URI is not defined"

**Solution**: Add to `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=confirmed_db
```

### "Invalid credentials" even with correct password

**Solution**: Verify password hashes in MongoDB:
```javascript
// In mongosh
db.users.findOne({ email: 'owner@techstore.tn' }, { password: 1 })
```

The password should start with `$2b$10$` (bcrypt hash).

If not, regenerate hashes:
```bash
node generate_password_hash.js
# Then run the update commands in mongosh
```

### "JWT_SECRET is not defined"

**Solution**: Add to `.env`:
```env
JWT_SECRET=$(openssl rand -base64 32)
```

Or use any random string (32+ characters recommended).

### Application won't start after changes

**Solution**: 
1. Stop the application (Ctrl+C or `pm2 stop confirmed`)
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev` or `pm2 restart confirmed`

## Testing Authentication

### 1. Test Login API Directly

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@techstore.tn","password":"owner123"}'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "owner@techstore.tn",
    "firstName": "Mohamed",
    "lastName": "Alami",
    "role": "shop_owner",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Test in Browser

1. Open your application
2. Navigate to login page
3. Enter credentials:
   - Email: `owner@techstore.tn`
   - Password: `owner123`
4. Click "Sign In"
5. Should redirect to dashboard

### 3. Check Browser Console

Open DevTools (F12) and check:
- Network tab: Look for `/api/auth/login` request
- Console tab: Check for any errors
- Application tab → Local Storage: Verify `auth-storage` exists

## Production Considerations

Before deploying to production:

1. **Change JWT Secret**: Generate a strong, unique secret
   ```bash
   openssl rand -base64 64
   ```

2. **Use Environment Variables**: Never commit secrets to git
   ```env
   JWT_SECRET=${YOUR_PRODUCTION_SECRET}
   ```

3. **Enable HTTPS**: JWT tokens should only be transmitted over HTTPS

4. **Set Secure Cookies**: Consider using httpOnly cookies instead of localStorage

5. **Implement Rate Limiting**: Prevent brute force attacks on login endpoint

6. **Add Logging**: Log failed login attempts for security monitoring

7. **Password Policy**: Enforce strong passwords for new users

8. **Token Refresh**: Implement refresh tokens for better security

## Next Steps

After authentication is working:

1. ✅ Login with shop owner account
2. ✅ Verify dashboard loads with demo data
3. ✅ Test all features (orders, products, analytics)
4. ✅ Record your demo
5. ✅ Deploy to production (with security hardening)

## Support

If you encounter issues:

1. Check application logs
2. Check MongoDB connection
3. Verify environment variables
4. Test API endpoint directly with curl
5. Check browser console for errors

---

**Authentication is now set up and ready to use!** 🎉
