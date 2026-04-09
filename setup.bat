@echo off
REM Motor Dashboard - Quick Setup Script (Windows)
REM Run this from the project root directory

echo.
echo 🚀 Motor Dashboard Setup
echo =========================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
echo Node: 
node --version
echo NPM: 
npm --version
echo.

REM Check certificates
echo Checking AWS IoT certificates...
if not exist "private.key" (
    echo ERROR: Missing - private.key
    pause
    exit /b 1
)
if not exist "certificate.pem.crt" (
    echo ERROR: Missing - certificate.pem.crt
    pause
    exit /b 1
)
if not exist "AmazonRootCA1.pem" (
    echo ERROR: Missing - AmazonRootCA1.pem
    pause
    exit /b 1
)
echo OK - private.key found
echo OK - certificate.pem.crt found
echo OK - AmazonRootCA1.pem found
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: NPM install failed
    pause
    exit /b 1
)
echo OK - Dependencies installed
echo.

REM Start server
echo Starting Motor Dashboard Server...
echo HTTP Server: http://localhost:3000
echo To stop: Press Ctrl+C
echo.
call npm start
