#!/bin/bash

# Conductor Setup Script
# This script sets up a new workspace with dependencies and environment configuration

set -e  # Exit on error

echo "🔧 Setting up workspace..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    echo "Please install Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version must be >= 18.0.0"
    echo "Current version: $(node -v)"
    exit 1
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed."
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

echo "✓ Node.js $(node -v) and pnpm $(pnpm -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup backend .env file
BACKEND_ENV="./packages/backend/.env"
BACKEND_ENV_EXAMPLE="./packages/backend/.env.example"

if [ ! -f "$BACKEND_ENV" ]; then
    if [ -f "$BACKEND_ENV_EXAMPLE" ]; then
        cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV"
        echo "⚠️  Created $BACKEND_ENV from example file"
        echo "⚠️  IMPORTANT: Please configure the following in $BACKEND_ENV:"
        echo "   - STRIPE_WEBHOOK_SECRET (from Stripe Dashboard)"
        echo "   - AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
        echo "   - Database connection (if not using defaults)"
        echo "   - Redis connection (if required)"
    else
        echo "⚠️  Warning: No .env.example found in backend"
    fi
else
    echo "✓ Backend .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo "💡 Run 'pnpm dev' to start the development servers"
