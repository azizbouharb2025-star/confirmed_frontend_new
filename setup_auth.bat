@echo off
echo ============================================
echo Setting up Authentication for Confirmed
echo ============================================
echo.

REM Install required dependencies
echo Installing required packages...
call npm install bcryptjs jsonwebtoken mongodb
call npm install --save-dev @types/bcryptjs @types/jsonwebtoken

if %ERRORLEVEL% NEQ 0 (
    echo Failed to install packages
    pause
    exit /b 1
)

echo Packages installed successfully
echo.

REM Check if .env exists
if not exist ".env" (
    echo .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
)

REM Check if MongoDB URI is set
findstr /C:"MONGODB_URI=" .env >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Adding MongoDB configuration to .env...
    echo. >> .env
    echo # MongoDB Configuration >> .env
    echo MONGODB_URI=mongodb://127.0.0.1:27017 >> .env
    echo MONGODB_DB=confirmed_db >> .env
)

REM Check if JWT_SECRET is set
findstr /C:"JWT_SECRET=" .env >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Adding JWT secret to .env...
    REM Generate a simple random string for JWT_SECRET
    set JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%
    echo JWT_SECRET=%JWT_SECRET% >> .env
)

echo.
echo ============================================
echo Authentication setup complete!
echo ============================================
echo.
echo Next steps:
echo 1. Verify your .env file has:
echo    - MONGODB_URI=mongodb://127.0.0.1:27017
echo    - MONGODB_DB=confirmed_db
echo    - JWT_SECRET=(auto-generated)
echo.
echo 2. Restart your Next.js application:
echo    npm run dev
echo.
echo 3. Try logging in with:
echo    Email: owner@techstore.tn
echo    Password: owner123
echo.
pause
