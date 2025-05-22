@echo off
REM DocuChat AI Startup Script for Windows

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
    set NODE_VERSION=%%a
)
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo Node.js version is too old. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "frontend\node_modules" (
    echo Installing dependencies...
    call npm run install:all
) else if not exist "backend\node_modules" (
    echo Installing dependencies...
    call npm run install:all
)

REM Check if .env file exists in backend
if not exist "backend\.env" (
    echo Creating .env file from .env.example...
    copy backend\.env.example backend\.env
    echo Please edit backend\.env with your API keys and configuration.
    echo Press any key to continue...
    pause >nul
)

REM Start the application
echo Starting DocuChat AI...
call npm run dev
