#!/bin/bash

################################################################################
# JODDB Production Run Script (Master)
# ====================================
# Simplified master script to run both backend and frontend in production mode
#
# Usage:
#   bash run-all-prod.sh                # Run both backend and frontend
#   bash run-all-prod.sh --backend-only # Run only backend
#   bash run-all-prod.sh --frontend-only # Run only frontend
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default configuration
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_ONLY=false
FRONTEND_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  JODDB Production Environment          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Determine what to run
RUN_BACKEND=true
RUN_FRONTEND=true

if [[ "$BACKEND_ONLY" == "true" ]] && [[ "$FRONTEND_ONLY" == "true" ]]; then
    echo -e "${RED}❌ Cannot specify both --backend-only and --frontend-only${NC}"
    exit 1
fi

if [[ "$BACKEND_ONLY" == "true" ]]; then
    RUN_FRONTEND=false
elif [[ "$FRONTEND_ONLY" == "true" ]]; then
    RUN_BACKEND=false
fi

# Create log directory
LOG_DIR="/tmp/joddb-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    
    if [[ "$RUN_BACKEND" == "true" ]] && [[ -n "${BACKEND_PID:-}" ]]; then
        if kill $BACKEND_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Backend stopped${NC}"
        fi
    fi
    
    if [[ "$RUN_FRONTEND" == "true" ]] && [[ -n "${FRONTEND_PID:-}" ]]; then
        if kill $FRONTEND_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Frontend stopped${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ Goodbye!${NC}\n"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
if [[ "$RUN_BACKEND" == "true" ]]; then
    echo -e "${BLUE}Starting Backend...${NC}"
    
    # Export environment variables for backend
    export BIND_PORT=$BACKEND_PORT
    
    bash "${SCRIPT_DIR}/run-backend-prod.sh" > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo -e "${YELLOW}   Logs: ${GREEN}${BACKEND_LOG}${NC}"
    echo -e "${YELLOW}   URL: ${GREEN}http://localhost:${BACKEND_PORT}${NC}\n"
    
    # Wait a bit for backend to start
    sleep 3
fi

# Start Frontend
if [[ "$RUN_FRONTEND" == "true" ]]; then
    echo -e "${BLUE}Starting Frontend...${NC}"
    
    # Export environment variables for frontend
    export FRONTEND_PORT=$FRONTEND_PORT
    export BACKEND_URL="http://localhost:${BACKEND_PORT}"
    
    bash "${SCRIPT_DIR}/run-frontend-prod.sh" > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo -e "${YELLOW}   Logs: ${GREEN}${FRONTEND_LOG}${NC}"
    echo -e "${YELLOW}   URL: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}\n"
fi

# Display summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        JODDB Running                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

if [[ "$RUN_BACKEND" == "true" ]]; then
    echo -e "${GREEN}Backend API:${NC}  http://localhost:${BACKEND_PORT}/api/v1/"
    echo -e "${GREEN}Admin Panel:${NC}   http://localhost:${BACKEND_PORT}/admin/"
fi

if [[ "$RUN_FRONTEND" == "true" ]]; then
    echo -e "${GREEN}Application:${NC}  http://localhost:${FRONTEND_PORT}"
fi

echo -e "\n${YELLOW}Logs directory: ${GREEN}${LOG_DIR}${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Keep the script running
wait
