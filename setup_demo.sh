#!/bin/bash

echo "============================================"
echo "Confirmed Platform - Demo Data Setup"
echo "============================================"
echo ""

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "❌ ERROR: mongosh not found!"
    echo "Please install MongoDB Shell: https://www.mongodb.com/try/download/shell"
    exit 1
fi

echo "📦 Step 1: Running seed script..."
echo ""
mongosh confirmed_db < seed_demo_data.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERROR: Seed script failed!"
    echo "Check the error messages above."
    exit 1
fi

echo ""
echo "============================================"
echo "🔐 Step 2: Generate password hashes"
echo "============================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "⚠️  WARNING: Node.js not found!"
    echo "You'll need to set passwords manually."
    echo "See DEMO_SETUP_README.md for instructions."
    exit 0
fi

# Check if bcryptjs is installed
if [ ! -d "node_modules/bcryptjs" ]; then
    echo "Installing bcryptjs..."
    npm install bcryptjs
fi

echo ""
echo "Generating password hashes..."
echo ""
node generate_password_hash.js

echo ""
echo "============================================"
echo "✅ SUCCESS! Demo data created."
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Copy the MongoDB commands above"
echo "2. Run them in mongosh to set passwords"
echo "3. Login with: owner@techstore.tn"
echo ""
echo "See DEMO_SETUP_README.md for more details."
echo ""
