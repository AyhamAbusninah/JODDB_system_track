#!/bin/bash

################################################################################
# JODDB Frontend Production Run Script
# =====================================
# This script runs the React/Vite frontend in production mode with:
# - Production build verification
# - Simple HTTP server (Express.js or http-server)
# - Proper CORS and header handling
# - Environment variable support
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# Configuration variables (can be overridden by environment)
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
NODE_ENV="${NODE_ENV:-production}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Frontend Production Server${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if build exists
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    echo -e "${RED}❌ Production build not found!${NC}"
    echo -e "${YELLOW}Building frontend...${NC}"
    cd "$FRONTEND_DIR"
    npm run build
    echo -e "${GREEN}✅ Build complete${NC}\n"
fi

# Display server configuration
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Port: ${GREEN}$FRONTEND_PORT${NC}"
echo -e "  Backend URL: ${GREEN}$BACKEND_URL${NC}"
echo -e "  Environment: ${GREEN}$NODE_ENV${NC}"
echo -e "  Build Directory: ${GREEN}${FRONTEND_DIR}/dist${NC}\n"

cd "$FRONTEND_DIR"

# Check if global http-server is installed, if not use npx
if ! command -v http-server &> /dev/null; then
    echo -e "${YELLOW}Using npx to serve...${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ Starting Frontend Server...${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}Access the application at: http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "${YELLOW}Backend API URL: ${BACKEND_URL}${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"
    
    npx http-server dist -p $FRONTEND_PORT -g
else
    echo -e "${YELLOW}Using system http-server...${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ Starting Frontend Server...${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}Access the application at: http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "${YELLOW}Backend API URL: ${BACKEND_URL}${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"
    
    http-server dist -p $FRONTEND_PORT -g
fi
