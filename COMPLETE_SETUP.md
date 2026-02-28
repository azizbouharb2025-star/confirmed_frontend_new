# Complete Demo Setup - All Steps

This guide combines everything you need to set up the complete demo environment.

## 🚀 Quick Setup (Ubuntu/VPS)

Run these commands in order:

```bash
# 1. Install authentication dependencies
chmod +x setup_auth.sh
./setup_auth.sh

# 2. Seed demo data
mongosh confirmed_db < seed_demo_data.js

# 3. Generate and set passwords
node generate_password_hash.js
# Copy the output commands and run them in mongosh

# 4. Restart application
pm2 restart confirmed
# or
npm run dev
```

## 📋 Detailed Steps

### Step 1: Setup Authentication (NEW!)

The authentication API was missing. Run the setup script:

```bash
./setup_auth.sh
```

This installs:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `mongodb` - Database driver
- TypeScript types

And configures:
- MongoDB connection URI
- JWT secret key
- Environment variables

### Step 2: Seed Demo Data

```bash
mongosh confirmed_db < seed_demo_data.js
```

This creates:
- 4 users (admin, shop owner, 2 operators)
- 3 shops
- 10 products
- 400-500 orders
- All demo data

### Step 3: Set Passwords

```bash
node generate_password_hash.js
```

Copy the output commands and paste into mongosh:

```javascript
db.users.updateOne(
  { email: 'owner@techstore.tn' },
  { $set: { password: '$2b$10$...' } }
);
// ... repeat for all users
```

### Step 4: Restart Application

```bash
# If using PM2
pm2 restart confirmed

# If running manually
# Press Ctrl+C to stop
npm run dev
```

## 🔑 Login

After setup:

- **URL**: http://your-vps-ip:3000
- **Email**: owner@techstore.tn
- **Password**: owner123

## ✅ Verification Checklist

- [ ] Authentication packages installed
- [ ] `.env` file configured with MongoDB URI and JWT secret
- [ ] Demo data seeded (users, shops, orders, etc.)
- [ ] Passwords set with bcrypt hashes
- [ ] Application restarted
- [ ] Can login successfully
- [ ] Dashboard shows demo data

## 🐛 Troubleshooting

### "Invalid credentials" error

**Cause**: Authentication API was missing or packages not installed

**Solution**: Run `./setup_auth.sh` and restart application

### "Cannot find module 'bcryptjs'"

**Solution**:
```bash
npm install bcryptjs jsonwebtoken mongodb
```

### "MONGODB_URI is not defined"

**Solution**: Add to `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=confirmed_db
JWT_SECRET=your-random-secret-key
```

### Still can't login

1. Check application is running: `pm2 status` or check terminal
2. Check MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
3. Test API directly:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"owner@techstore.tn","password":"owner123"}'
   ```
4. Check browser console (F12) for errors
5. Check application logs: `pm2 logs confirmed`

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `setup_auth.sh` | Install auth packages and configure env |
| `seed_demo_data.js` | Create all demo data |
| `generate_password_hash.js` | Generate bcrypt password hashes |
| `app/api/auth/login/route.ts` | Login API endpoint (created) |
| `lib/mongodb.ts` | MongoDB connection (created) |
| `AUTH_SETUP_GUIDE.md` | Detailed auth setup guide |
| `DEMO_SETUP_README.md` | Demo data setup guide |

## 🎬 Ready to Record

Once login works:

1. ✅ Login as shop owner
2. ✅ Verify all widgets show data
3. ✅ Test time range filters
4. ✅ Test data exports
5. ✅ Start recording your demo!

---

**Everything is now set up! Login and start your demo.** 🎉
