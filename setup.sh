#!/bin/bash
# Motor Dashboard - Quick Setup Script
# Run this after cloning/downloading the project

echo "🚀 Motor Dashboard Setup"
echo "========================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi
echo "  Node: $(node --version)"
echo "  NPM: $(npm --version)"
echo ""

# Check certificates
echo "✓ Checking AWS IoT certificates..."
if [ ! -f "private.key" ]; then
    echo "❌ Missing: private.key"
    exit 1
fi
if [ ! -f "certificate.pem.crt" ]; then
    echo "❌ Missing: certificate.pem.crt"
    exit 1
fi
if [ ! -f "AmazonRootCA1.pem" ]; then
    echo "❌ Missing: AmazonRootCA1.pem"
    exit 1
fi
echo "  ✓ private.key found"
echo "  ✓ certificate.pem.crt found"
echo "  ✓ AmazonRootCA1.pem found"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ NPM install failed"
    exit 1
fi
echo "  ✓ Dependencies installed"
echo ""

# Start server
echo "✓ Starting Motor Dashboard Server..."
echo "  HTTP Server: http://localhost:3000"
echo "  To stop: Press Ctrl+C"
echo ""
npm start
