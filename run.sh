#!/bin/bash

# DocuChat AI Startup Script

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version is too old. Please install Node.js v18 or higher."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "Installing dependencies..."
    npm run install:all
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your API keys and configuration."
    echo "Press any key to continue..."
    read -n 1
fi

# Start the application
echo "Starting DocuChat AI..."
npm run dev
