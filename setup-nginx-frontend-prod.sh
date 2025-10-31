#!/bin/bash

################################################################################
# JODDB Nginx + Frontend Build Setup Script
# ==========================================
# This script automates both:
# 1. Nginx reverse proxy configuration for production
# 2. Frontend React/Vite build optimization
#
# Perfect for production deployment where Nginx serves the built frontend
# and proxies API requests to the Django backend.
#
# Usage:
#   sudo bash setup-nginx-frontend-prod.sh
#   sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh
#   sudo DOMAIN=yourdomain.com USE_SELF_SIGNED=true bash setup-nginx-frontend-prod.sh
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration Variables
DOMAIN="${DOMAIN:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
NGINX_CONFIG_DIR="/etc/nginx"
NGINX_SITES_DIR="${NGINX_CONFIG_DIR}/sites-available"
NGINX_ENABLED_DIR="${NGINX_CONFIG_DIR}/sites-enabled"
NGINX_CONF_NAME="joddb"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${DOMAIN}}"
USE_SELF_SIGNED="${USE_SELF_SIGNED:-false}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
NODE_MIN_VERSION="16"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     JODDB Nginx + Frontend Build Setup              ║${NC}"
echo -e "${BLUE}║  (Nginx Configuration + Frontend Production Build)  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}\n"

# ============================================================================
# PART 1: FRONTEND SETUP
# ============================================================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PART 1: FRONTEND BUILD SETUP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 1: Check Node.js installation
echo -e "${YELLOW}[1/7]${NC} Checking Node.js installation..."
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
echo -e "${YELLOW}[2/7]${NC} Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version) found${NC}\n"

# Step 3: Install frontend dependencies
echo -e "${YELLOW}[3/7]${NC} Installing frontend dependencies..."
cd "$FRONTEND_DIR"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}   Cleaning node_modules...${NC}"
    rm -rf node_modules package-lock.json > /dev/null 2>&1 || true
fi

npm install 2>&1 | grep -E "^(added|up to date)" | tail -1 || true
echo -e "${GREEN}✅ Frontend dependencies installed${NC}\n"

# Step 4: Build frontend for production
echo -e "${YELLOW}[4/7]${NC} Building frontend for production..."
npm run build > /dev/null 2>&1
BUILD_SIZE=$(du -sh dist/ 2>/dev/null | awk '{print $1}')
echo -e "${GREEN}✅ Frontend build complete${NC}"
echo -e "${YELLOW}   Build size: ${GREEN}${BUILD_SIZE}${NC}\n"

# ============================================================================
# PART 2: NGINX SETUP (requires sudo)
# ============================================================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PART 2: NGINX CONFIGURATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 5: Check if running as root
echo -e "${YELLOW}[5/7]${NC} Checking permissions..."
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
   exit 1
fi
echo -e "${GREEN}✅ Running with appropriate permissions${NC}\n"

# Step 6: Install Nginx
echo -e "${YELLOW}[6/7]${NC} Installing and configuring Nginx..."
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $NF}')
    echo -e "${YELLOW}   Nginx ${NGINX_VERSION} already installed${NC}"
else
    echo -e "${YELLOW}   Installing Nginx...${NC}"
    apt-get update > /dev/null 2>&1
    apt-get install -y nginx > /dev/null 2>&1
    NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $NF}')
    echo -e "${GREEN}✅ Nginx ${NGINX_VERSION} installed${NC}"
fi

# Create SSL certificates if needed
SSL_CERT=""
SSL_KEY=""

if [ "$USE_SELF_SIGNED" = "true" ]; then
    SELF_SIGNED_DIR="/etc/nginx/certs"
    mkdir -p "$SELF_SIGNED_DIR"
    
    if [ ! -f "${SELF_SIGNED_DIR}/joddb.crt" ] || [ ! -f "${SELF_SIGNED_DIR}/joddb.key" ]; then
        echo -e "${YELLOW}   Generating self-signed certificates...${NC}"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${SELF_SIGNED_DIR}/joddb.key" \
            -out "${SELF_SIGNED_DIR}/joddb.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}" \
            2>/dev/null
    fi
    SSL_CERT="${SELF_SIGNED_DIR}/joddb.crt"
    SSL_KEY="${SELF_SIGNED_DIR}/joddb.key"
elif [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo -e "${YELLOW}   Using existing Let's Encrypt certificates${NC}"
else
    # Fallback to self-signed
    SELF_SIGNED_DIR="/etc/nginx/certs"
    mkdir -p "$SELF_SIGNED_DIR"
    if [ ! -f "${SELF_SIGNED_DIR}/joddb.crt" ] || [ ! -f "${SELF_SIGNED_DIR}/joddb.key" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${SELF_SIGNED_DIR}/joddb.key" \
            -out "${SELF_SIGNED_DIR}/joddb.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}" \
            2>/dev/null
    fi
    SSL_CERT="${SELF_SIGNED_DIR}/joddb.crt"
    SSL_KEY="${SELF_SIGNED_DIR}/joddb.key"
fi

# Create Nginx configuration
cat > "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" << 'NGINX_CONFIG'
# JODDB Application - Nginx Reverse Proxy Configuration
# Production setup with frontend SPA and backend API

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;
    client_max_body_size 100M;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL Configuration
    ssl_certificate SSL_CERT_PLACEHOLDER;
    ssl_certificate_key SSL_KEY_PLACEHOLDER;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/joddb_access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/joddb_error.log warn;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;
    gzip_vary on;
    gzip_comp_level 6;

    client_max_body_size 100M;

    # ========== FRONTEND SPA ==========
    location / {
        root FRONTEND_BUILD_PLACEHOLDER;
        try_files $uri $uri/ /index.html;
        
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ========== STATIC FILES ==========
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root FRONTEND_BUILD_PLACEHOLDER;
        expires 30d;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    # ========== BACKEND API ==========
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://localhost:BACKEND_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_cache_bypass $http_pragma $http_authorization;
        add_header Cache-Control "no-store, must-revalidate";
        add_header Pragma "no-cache";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # ========== ADMIN PANEL ==========
    location /admin/ {
        limit_req zone=general_limit burst=10 nodelay;
        
        proxy_pass http://localhost:BACKEND_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Cache-Control "no-store, must-revalidate";
    }

    # ========== STATIC BACKEND FILES ==========
    location /static/ {
        alias BACKEND_STATIC_PLACEHOLDER;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ========== MEDIA FILES ==========
    location /media/ {
        alias BACKEND_MEDIA_PLACEHOLDER;
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
    }

    # ========== HEALTH CHECK ==========
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # ========== BLOCK SENSITIVE FILES ==========
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX_CONFIG

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|SSL_CERT_PLACEHOLDER|${SSL_CERT}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|SSL_KEY_PLACEHOLDER|${SSL_KEY}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|BACKEND_PORT_PLACEHOLDER|${BACKEND_PORT}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|FRONTEND_BUILD_PLACEHOLDER|${FRONTEND_DIR}/dist|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|BACKEND_STATIC_PLACEHOLDER|${SCRIPT_DIR}/backend/staticfiles/|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|BACKEND_MEDIA_PLACEHOLDER|${SCRIPT_DIR}/backend/media/|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"

echo -e "${GREEN}✅ Nginx configuration created${NC}\n"

# Enable the site
if [ -L "${NGINX_ENABLED_DIR}/default" ]; then
    rm "${NGINX_ENABLED_DIR}/default"
fi

if [ ! -L "${NGINX_ENABLED_DIR}/${NGINX_CONF_NAME}" ]; then
    ln -s "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" "${NGINX_ENABLED_DIR}/${NGINX_CONF_NAME}"
fi

# Test Nginx configuration
echo -e "${YELLOW}[7/7]${NC} Testing and starting Nginx..."
if ! nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Configuration test passed${NC}"

# Restart Nginx
if systemctl is-active --quiet nginx; then
    systemctl restart nginx
    sleep 2
    systemctl is-active --quiet nginx && \
    echo -e "${GREEN}✅ Nginx restarted successfully${NC}" || \
    echo -e "${RED}❌ Failed to restart Nginx${NC}"
else
    systemctl start nginx
    sleep 2
    systemctl is-active --quiet nginx && \
    echo -e "${GREEN}✅ Nginx started successfully${NC}" || \
    echo -e "${RED}❌ Failed to start Nginx${NC}"
fi

systemctl enable nginx > /dev/null 2>&1
echo -e "${GREEN}✅ Nginx enabled for auto-start${NC}\n"

# ============================================================================
# COMPLETION SUMMARY
# ============================================================================

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ SETUP COMPLETE: Nginx + Frontend Build         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Frontend Build:${NC}"
echo -e "  Build Location: ${GREEN}${FRONTEND_DIR}/dist${NC}"
echo -e "  Build Size: ${GREEN}${BUILD_SIZE}${NC}"
echo -e "  Status: ${GREEN}✅ Ready for serving${NC}\n"

echo -e "${YELLOW}Nginx Configuration:${NC}"
echo -e "  Config: ${GREEN}${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}"
echo -e "  Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "  Backend: ${GREEN}${BACKEND_PORT}${NC}"
echo -e "  Frontend Path: ${GREEN}${FRONTEND_DIR}/dist${NC}"
echo -e "  SSL Cert: ${GREEN}${SSL_CERT}${NC}"
echo -e "  Status: ${GREEN}✅ Running${NC}\n"

echo -e "${YELLOW}Verification Commands:${NC}"
echo -e "  ${GREEN}sudo systemctl status nginx${NC}"
echo -e "  ${GREEN}sudo nginx -t${NC}"
echo -e "  ${GREEN}curl https://${DOMAIN}/health${NC}"
echo -e "  ${GREEN}sudo tail -f /var/log/nginx/joddb_error.log${NC}\n"

echo -e "${YELLOW}Backend Requirements:${NC}"
echo -e "  ⚠️  Ensure backend is running on port ${BACKEND_PORT}"
echo -e "  ${GREEN}bash run-backend-prod.sh${NC}\n"

echo -e "${YELLOW}Production URL:${NC}"
echo -e "  ${GREEN}https://${DOMAIN}${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Start the backend: ${GREEN}bash run-backend-prod.sh${NC}"
echo -e "  2. Test the setup: ${GREEN}curl https://${DOMAIN}/health${NC}"
echo -e "  3. Monitor logs: ${GREEN}sudo tail -f /var/log/nginx/joddb_error.log${NC}\n"
