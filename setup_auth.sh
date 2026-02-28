#!/bin/bash

echo "============================================"
echo "Setting up Authentication for Confirmed"
echo "============================================"
echo ""

# Install required dependencies
echo "📦 Installing required packages..."
npm install bcryptjs jsonwebtoken mongodb
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

if [ $? -ne 0 ]; then
    echo "❌ Failed to install packages"
    exit 1
fi

echo "✅ Packages installed successfully"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Check if MongoDB URI is set
if ! grep -q "MONGODB_URI=" .env; then
    echo ""
    echo "📝 Adding MongoDB configuration to .env..."
    echo "" >> .env
    echo "# MongoDB Configuration" >> .env
    echo "MONGODB_URI=mongodb://127.0.0.1:27017" >> .env
    echo "MONGODB_DB=confirmed_db" >> .env
fi

# Check if JWT_SECRET is set
if ! grep -q "JWT_SECRET=" .env; then
    echo "📝 Adding JWT secret to .env..."
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo "JWT_SECRET=$JWT_SECRET" >> .env
fi

echo ""
echo "============================================"
echo "✅ Authentication setup complete!"
echo "============================================"
echo ""
echo "📋 Next steps:"
echo "1. Verify your .env file has:"
echo "   - MONGODB_URI=mongodb://127.0.0.1:27017"
echo "   - MONGODB_DB=confirmed_db"
echo "   - JWT_SECRET=(auto-generated)"
echo ""
echo "2. Restart your Next.js application:"
echo "   npm run dev"
echo ""
echo "3. Try logging in with:"
echo "   Email: owner@techstore.tn"
echo "   Password: owner123"
echo ""
