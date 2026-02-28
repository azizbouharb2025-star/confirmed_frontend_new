@echo off
echo ============================================
echo Confirmed Platform - Demo Data Setup
echo ============================================
echo.

REM Check if mongosh is available
where mongosh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: mongosh not found!
    echo Please install MongoDB Shell: https://www.mongodb.com/try/download/shell
    pause
    exit /b 1
)

echo Step 1: Running seed script...
echo.
mongosh confirmed_db < seed_demo_data.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Seed script failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Step 2: Generate password hashes
echo ============================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Node.js not found!
    echo You'll need to set passwords manually.
    echo See DEMO_SETUP_README.md for instructions.
    pause
    exit /b 0
)

REM Check if bcryptjs is installed
if not exist "node_modules\bcryptjs" (
    echo Installing bcryptjs...
    call npm install bcryptjs
)

echo.
echo Generating password hashes...
echo.
node generate_password_hash.js

echo.
echo ============================================
echo SUCCESS! Demo data created.
echo ============================================
echo.
echo Next steps:
echo 1. Copy the MongoDB commands above
echo 2. Run them in mongosh to set passwords
echo 3. Login with: owner@techstore.tn
echo.
echo See DEMO_SETUP_README.md for more details.
echo.
pause
