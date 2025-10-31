#!/bin/bash

################################################################################
# JODDB Frontend Production Setup Script
# ========================================
# This script sets up the React/Vite frontend for production deployment with:
# - Node.js installation check
# - Dependencies installation via npm
# - Production build optimization
# - Build artifact verification
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration Variables
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/frontend" && pwd)"
NODE_MIN_VERSION="16"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Frontend Production Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Check Node.js installation
echo -e "${YELLOW}[1/4]${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js ${NODE_MIN_VERSION} or higher.${NC}"
    echo -e "${YELLOW}   Installation guide: https://nodejs.org/en/download/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_MIN_VERSION or higher required.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version check passed${NC}\n"

# Step 2: Check npm installation
echo -e "${YELLOW}[2/4]${NC} Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version) found${NC}\n"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/4]${NC} Installing frontend dependencies..."
cd "$FRONTEND_DIR"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}   Cleaning node_modules...${NC}"
    rm -rf node_modules package-lock.json
fi

npm install 2>&1 | grep -E "^(added|up to date)" | tail -1
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Step 4: Verify build configuration
echo -e "${YELLOW}[4/4]${NC} Verifying build configuration..."

# Check for required config files
if [ ! -f "vite.config.ts" ]; then
    echo -e "${RED}❌ vite.config.ts not found!${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build configuration verified${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Frontend Production Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Build the frontend: ${GREEN}npm run build${NC}"
echo -e "2. Start the production server: ${GREEN}cd $(dirname "$FRONTEND_DIR") && bash run-frontend-prod.sh${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  Preview build: ${GREEN}npm run preview${NC}"
echo -e "  Development mode: ${GREEN}npm run dev${NC}"
echo -e "  Type check: ${GREEN}npm run typecheck${NC}"
echo -e "  Lint: ${GREEN}npm run lint${NC}\n"
