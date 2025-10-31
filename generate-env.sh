#!/bin/bash

################################################################################
# Generate Environment Files for JODDB (Frontend & Backend)
# =========================================================
# This script generates .env files for both frontend and backend with secure
# credentials and production-ready configuration.
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
BACKEND_ENV="${BACKEND_DIR}/.env"
FRONTEND_ENV="${FRONTEND_DIR}/.env"

# Configuration Variables
ENVIRONMENT="${ENVIRONMENT:-production}"
DOMAIN="${DOMAIN:-localhost}"
DEBUG="${DEBUG:-False}"
API_URL="${API_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

# Database defaults
DB_NAME="${DB_NAME:-joddb_prod}"
DB_USER="${DB_USER:-joddb_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Security defaults
USE_POSTGRESQL="${USE_POSTGRESQL:-True}"
SECURE_SSL_REDIRECT="${SECURE_SSL_REDIRECT:-True}"
SESSION_COOKIE_SECURE="${SESSION_COOKIE_SECURE:-True}"
CSRF_COOKIE_SECURE="${CSRF_COOKIE_SECURE:-True}"
SECURE_HSTS_SECONDS="${SECURE_HSTS_SECONDS:-31536000}"
SECURE_HSTS_INCLUDE_SUBDOMAINS="${SECURE_HSTS_INCLUDE_SUBDOMAINS:-True}"
SECURE_HSTS_PRELOAD="${SECURE_HSTS_PRELOAD:-True}"

# Flags for overwrite protection
FORCE_OVERWRITE="${FORCE_OVERWRITE:-false}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Environment File Generator${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to generate secure password
generate_password() {
    openssl rand -base64 16
}

# Function to generate Django SECRET_KEY
generate_secret_key() {
    openssl rand -base64 50
}

# Function to check if file exists
check_file_exists() {
    if [ -f "$1" ]; then
        if [ "$FORCE_OVERWRITE" = "true" ]; then
            return 0  # Force overwrite
        else
            return 1  # File exists, skip
        fi
    fi
    return 0  # File doesn't exist
}

# Function to backup existing file
backup_file() {
    if [ -f "$1" ]; then
        local backup="${1}.backup.$(date +%s)"
        cp "$1" "$backup"
        echo -e "${YELLOW}   Backed up to: ${backup}${NC}"
    fi
}

# ============================================================================
# BACKEND .env GENERATION
# ============================================================================

echo -e "${YELLOW}[1/2]${NC} Generating backend .env file..."

if check_file_exists "$BACKEND_ENV"; then
    backup_file "$BACKEND_ENV"
    
    # Generate secure credentials
    DB_PASSWORD="${DB_PASSWORD:-$(generate_password)}"
    SECRET_KEY="$(generate_secret_key)"
    
    # Determine ALLOWED_HOSTS and CORS based on domain
    if [ "$DOMAIN" = "localhost" ]; then
        ALLOWED_HOSTS="localhost,127.0.0.1"
        CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5173"
    else
        ALLOWED_HOSTS="${DOMAIN},www.${DOMAIN},localhost,127.0.0.1"
        CORS_ORIGINS="https://${DOMAIN},https://www.${DOMAIN},http://localhost:5173"
    fi
    
    # Create backend .env file
    cat > "$BACKEND_ENV" << EOF
# Django Configuration
ENVIRONMENT=${ENVIRONMENT}
SECRET_KEY=${SECRET_KEY}
DEBUG=${DEBUG}
ALLOWED_HOSTS=${ALLOWED_HOSTS}

# Database Configuration (PostgreSQL - REQUIRED for production)
USE_POSTGRESQL=${USE_POSTGRESQL}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_CONN_MAX_AGE=600

# Security (HTTPS Configuration)
SECURE_SSL_REDIRECT=${SECURE_SSL_REDIRECT}
SESSION_COOKIE_SECURE=${SESSION_COOKIE_SECURE}
CSRF_COOKIE_SECURE=${CSRF_COOKIE_SECURE}
SECURE_HSTS_SECONDS=${SECURE_HSTS_SECONDS}
SECURE_HSTS_INCLUDE_SUBDOMAINS=${SECURE_HSTS_INCLUDE_SUBDOMAINS}
SECURE_HSTS_PRELOAD=${SECURE_HSTS_PRELOAD}

# CORS Configuration
CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password

# Logging
LOG_LEVEL=INFO
EOF

    echo -e "${GREEN}✅ Backend .env created${NC}"
    echo -e "${CYAN}   Location: ${BACKEND_ENV}${NC}"
    echo -e "${CYAN}   Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}${NC}"
    echo -e "${CYAN}   User: ${DB_USER}${NC}"
    echo -e "${YELLOW}   Password: ${DB_PASSWORD}${NC}\n"

else
    echo -e "${YELLOW}   .env file already exists${NC}"
    echo -e "${CYAN}   Use FORCE_OVERWRITE=true to regenerate${NC}"
    echo -e "${YELLOW}   Location: ${BACKEND_ENV}\n${NC}"
fi

# ============================================================================
# FRONTEND .env GENERATION
# ============================================================================

echo -e "${YELLOW}[2/2]${NC} Generating frontend .env file..."

if check_file_exists "$FRONTEND_ENV"; then
    backup_file "$FRONTEND_ENV"
    
    # Determine API URL based on domain
    if [ "$DOMAIN" = "localhost" ]; then
        FRONTEND_API_URL="http://localhost:8000"
    else
        FRONTEND_API_URL="https://${DOMAIN}"
    fi
    
    # Create frontend .env file
    cat > "$FRONTEND_ENV" << EOF
# Backend API Configuration
VITE_API_URL=${FRONTEND_API_URL}

# Frontend Environment
VITE_ENVIRONMENT=${ENVIRONMENT}
VITE_APP_NAME=JODDB
VITE_APP_VERSION=1.0.0
EOF

    echo -e "${GREEN}✅ Frontend .env created${NC}"
    echo -e "${CYAN}   Location: ${FRONTEND_ENV}${NC}"
    echo -e "${CYAN}   API URL: ${FRONTEND_API_URL}\n${NC}"

else
    echo -e "${YELLOW}   .env file already exists${NC}"
    echo -e "${CYAN}   Use FORCE_OVERWRITE=true to regenerate${NC}"
    echo -e "${YELLOW}   Location: ${FRONTEND_ENV}\n${NC}"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Environment Files Generated${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${CYAN}Backend Configuration:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Debug: ${DEBUG}"
echo -e "  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo -e "  Allowed Hosts: ${ALLOWED_HOSTS}"
echo -e "  CORS Origins: ${CORS_ORIGINS}"
echo -e "  HTTPS: ${SECURE_SSL_REDIRECT}\n"

echo -e "${CYAN}Frontend Configuration:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  API URL: ${FRONTEND_API_URL}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review credentials in: ${BACKEND_ENV}"
echo -e "  2. Update EMAIL settings if needed"
echo -e "  3. Run: bash setup-backend-prod.sh"
echo -e "  4. Run: bash setup-frontend-prod.sh\n"

echo -e "${YELLOW}To regenerate with different domain:${NC}"
echo -e "  DOMAIN=yourdomain.com FORCE_OVERWRITE=true bash generate-env.sh\n"

echo -e "${YELLOW}Custom configuration:${NC}"
echo -e "  DB_NAME=mydb ENVIRONMENT=staging bash generate-env.sh\n"
