#!/bin/bash

################################################################################
# JODDB Backend Production Run Script
# ====================================
# This script runs the Django backend in production mode using Gunicorn with:
# - Environment variable loading from .env
# - Gunicorn WSGI server
# - Auto-reloading on code changes (can be disabled for true production)
# - Logging configuration
# - Graceful shutdown handling
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the script directory and resolve absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/venv"
ENV_FILE="${BACKEND_DIR}/.env"

# Configuration variables (can be overridden by environment)
WORKERS="${WORKERS:-4}"
WORKER_CLASS="${WORKER_CLASS:-sync}"
WORKER_TIMEOUT="${WORKER_TIMEOUT:-120}"
BIND_HOST="${BIND_HOST:-0.0.0.0}"
BIND_PORT="${BIND_PORT:-8000}"
LOG_LEVEL="${LOG_LEVEL:-info}"
RELOAD="${RELOAD:-false}"  # Set to true for development, false for production

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Backend Production Server${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Please run: bash setup-backend-prod.sh${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please run: bash setup-backend-prod.sh${NC}"
    exit 1
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Load environment variables from .env file
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

cd "$BACKEND_DIR"

# Display server configuration
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Workers: ${GREEN}$WORKERS${NC}"
echo -e "  Worker Class: ${GREEN}$WORKER_CLASS${NC}"
echo -e "  Bind Address: ${GREEN}${BIND_HOST}:${BIND_PORT}${NC}"
echo -e "  Log Level: ${GREEN}$LOG_LEVEL${NC}"
echo -e "  Reload: ${GREEN}$RELOAD${NC}"
echo -e "  Database: ${GREEN}${DB_NAME}${NC}"
echo -e "  Database Host: ${GREEN}${DB_HOST}:${DB_PORT}${NC}\n"

# Build gunicorn command
GUNICORN_CMD="gunicorn"
GUNICORN_CMD="$GUNICORN_CMD --workers $WORKERS"
GUNICORN_CMD="$GUNICORN_CMD --worker-class $WORKER_CLASS"
GUNICORN_CMD="$GUNICORN_CMD --worker-tmp-dir /dev/shm"
GUNICORN_CMD="$GUNICORN_CMD --timeout $WORKER_TIMEOUT"
GUNICORN_CMD="$GUNICORN_CMD --bind ${BIND_HOST}:${BIND_PORT}"
GUNICORN_CMD="$GUNICORN_CMD --log-level $LOG_LEVEL"
GUNICORN_CMD="$GUNICORN_CMD --access-logfile -"
GUNICORN_CMD="$GUNICORN_CMD --error-logfile -"

# Add reload flag if development mode
if [ "$RELOAD" = "true" ]; then
    GUNICORN_CMD="$GUNICORN_CMD --reload"
    echo -e "${YELLOW}⚠️  Running in development mode with auto-reload${NC}\n"
else
    echo -e "${GREEN}Running in production mode${NC}\n"
fi

# Run Django checks before starting server
echo -e "${YELLOW}Running Django checks...${NC}"
python manage.py check || {
    echo -e "${RED}❌ Django checks failed!${NC}"
    exit 1
}
echo -e "${GREEN}✅ All checks passed${NC}\n"

# Print startup message
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Starting Django Backend Server...${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Access the API at: http://${BIND_HOST}:${BIND_PORT}/api/v1/${NC}"
echo -e "${YELLOW}Admin panel at: http://${BIND_HOST}:${BIND_PORT}/admin/${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

# Handle graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}Shutting down gracefully...${NC}"
    deactivate
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the server
$GUNICORN_CMD joddb_backend.wsgi:application
