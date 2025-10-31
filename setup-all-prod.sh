#!/bin/bash

################################################################################
# JODDB Complete Production Setup & Run Script
# =============================================
# This master script coordinates setup and running of both backend and frontend
# in production mode with proper environment configuration.
#
# Usage:
#   bash setup-all-prod.sh              - Setup everything
#   bash run-all-prod.sh                - Run everything
#   bash run-all-prod.sh --backend-only - Run only backend
#   bash run-all-prod.sh --frontend-only - Run only frontend
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
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# Default configuration
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_ONLY="${BACKEND_ONLY:-false}"
FRONTEND_ONLY="${FRONTEND_ONLY:-false}"

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
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  JODDB Production Environment Manager  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Parse the command - if first argument is "setup", run setup; otherwise run
COMMAND="${1:-run}"

if [[ "$COMMAND" == "setup" ]]; then
    echo -e "${YELLOW}Setting up JODDB production environment...${NC}\n"
    
    # Setup Backend
    if [[ "$FRONTEND_ONLY" != "true" ]]; then
        echo -e "${BLUE}========== Backend Setup ==========${NC}"
        bash "${SCRIPT_DIR}/setup-backend-prod.sh"
    fi
    
    # Setup Frontend
    if [[ "$BACKEND_ONLY" != "true" ]]; then
        echo -e "${BLUE}========== Frontend Setup ==========${NC}"
        bash "${SCRIPT_DIR}/setup-frontend-prod.sh"
    fi
    
    echo -e "\n${GREEN}✅ Setup Complete!${NC}"
    echo -e "${YELLOW}To start the servers, run:${NC}"
    echo -e "  ${GREEN}bash run-all-prod.sh${NC}\n"

else
    # Run mode
    echo -e "${YELLOW}Starting JODDB servers in production mode...${NC}\n"
    
    # Determine what to run
    if [[ "$BACKEND_ONLY" == "true" ]] && [[ "$FRONTEND_ONLY" == "true" ]]; then
        echo -e "${RED}❌ Cannot specify both --backend-only and --frontend-only${NC}"
        exit 1
    fi
    
    # Create a temporary directory for logs
    LOG_DIR="/tmp/joddb-logs"
    mkdir -p "$LOG_DIR"
    BACKEND_LOG="${LOG_DIR}/backend.log"
    FRONTEND_LOG="${LOG_DIR}/frontend.log"
    
    echo -e "${YELLOW}Logs directory: ${GREEN}${LOG_DIR}${NC}\n"
    
    # Function to handle cleanup on exit
    cleanup() {
        echo -e "\n${YELLOW}Shutting down servers...${NC}"
        
        if [[ "$RUN_BACKEND" == "true" ]]; then
            if kill $BACKEND_PID 2>/dev/null; then
                echo -e "${GREEN}✅ Backend stopped${NC}"
            fi
        fi
        
        if [[ "$RUN_FRONTEND" == "true" ]]; then
            if kill $FRONTEND_PID 2>/dev/null; then
                echo -e "${GREEN}✅ Frontend stopped${NC}"
            fi
        fi
        
        echo -e "${GREEN}✅ Goodbye!${NC}\n"
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Determine what to run
    RUN_BACKEND=true
    RUN_FRONTEND=true
    
    if [[ "$BACKEND_ONLY" == "true" ]]; then
        RUN_FRONTEND=false
    elif [[ "$FRONTEND_ONLY" == "true" ]]; then
        RUN_BACKEND=false
    fi
    
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
        sleep 2
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
        echo -e "${GREEN}Backend:${NC}  http://localhost:${BACKEND_PORT}/api/v1/"
        echo -e "${GREEN}Admin:${NC}    http://localhost:${BACKEND_PORT}/admin/"
    fi
    
    if [[ "$RUN_FRONTEND" == "true" ]]; then
        echo -e "${GREEN}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
    fi
    
    echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"
    
    # Keep the script running
    if [[ "$RUN_BACKEND" == "true" ]]; then
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    if [[ "$RUN_FRONTEND" == "true" ]]; then
        wait $FRONTEND_PID 2>/dev/null || true
    fi
fi
