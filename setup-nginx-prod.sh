#!/bin/bash

################################################################################
# JODDB Nginx Production Setup Script
# ====================================
# This script automates the installation and configuration of Nginx as a
# reverse proxy for the JODDB application in production environments.
#
# Features:
# - Automated Nginx installation
# - Production-ready Nginx configuration
# - SSL certificate setup support (Let's Encrypt or self-signed)
# - HTTPS/HTTP/2 support
# - Security headers and optimizations
# - Automatic service management
# - Backup of existing configurations
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Nginx Production Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Check if running as root or with sudo
echo -e "${YELLOW}[1/7]${NC} Checking permissions..."
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
   exit 1
fi
echo -e "${GREEN}✅ Running with appropriate permissions${NC}\n"

# Step 2: Install Nginx
echo -e "${YELLOW}[2/7]${NC} Installing Nginx..."
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
echo -e "${GREEN}✅ Nginx installation verified${NC}\n"

# Step 3: Backup existing configuration if it exists
echo -e "${YELLOW}[3/7]${NC} Managing existing configurations..."
if [ -f "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" ]; then
    BACKUP_FILE="${NGINX_SITES_DIR}/${NGINX_CONF_NAME}.backup.$(date +%s)"
    echo -e "${YELLOW}   Backing up existing configuration to ${BACKUP_FILE}${NC}"
    cp "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" "${BACKUP_FILE}"
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${YELLOW}   No existing configuration to backup${NC}"
fi
echo ""

# Step 4: Create SSL certificates (if needed)
echo -e "${YELLOW}[4/7]${NC} Setting up SSL certificates..."

# Determine SSL certificate paths
SSL_CERT="${CERT_DIR}/fullchain.pem"
SSL_KEY="${CERT_DIR}/privkey.pem"

if [ "$USE_SELF_SIGNED" = "true" ]; then
    echo -e "${YELLOW}   Using self-signed certificates${NC}"
    
    # Create self-signed certificates
    SELF_SIGNED_DIR="/etc/nginx/certs"
    mkdir -p "$SELF_SIGNED_DIR"
    
    if [ ! -f "${SELF_SIGNED_DIR}/joddb.crt" ] || [ ! -f "${SELF_SIGNED_DIR}/joddb.key" ]; then
        echo -e "${YELLOW}   Generating self-signed certificates...${NC}"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${SELF_SIGNED_DIR}/joddb.key" \
            -out "${SELF_SIGNED_DIR}/joddb.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}" \
            2>/dev/null || {
            echo -e "${RED}❌ Failed to generate self-signed certificates${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ Self-signed certificates generated${NC}"
    else
        echo -e "${YELLOW}   Self-signed certificates already exist${NC}"
    fi
    
    SSL_CERT="${SELF_SIGNED_DIR}/joddb.crt"
    SSL_KEY="${SELF_SIGNED_DIR}/joddb.key"
    
elif [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo -e "${YELLOW}   Using Let's Encrypt certificates${NC}"
    echo -e "${GREEN}✅ SSL certificates found at ${CERT_DIR}${NC}"
    
else
    echo -e "${YELLOW}   No SSL certificates found${NC}"
    echo -e "${YELLOW}   Instructions for Let's Encrypt setup:${NC}"
    echo -e "${CYAN}   1. Install Certbot: sudo apt-get install certbot python3-certbot-nginx${NC}"
    echo -e "${CYAN}   2. Generate certificate: sudo certbot certonly --standalone -d ${DOMAIN}${NC}"
    echo -e "${CYAN}   3. Re-run this script after certificates are ready${NC}"
    echo -e "${YELLOW}   For now, using self-signed certificate for testing...${NC}\n"
    
    # Generate self-signed as fallback
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

echo -e "${GREEN}✅ SSL certificate setup complete${NC}\n"

# Step 5: Create Nginx configuration
echo -e "${YELLOW}[5/7]${NC} Creating Nginx configuration..."

cat > "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" << 'NGINX_CONFIG'
# JODDB Application - Nginx Reverse Proxy Configuration
# =======================================================
# This configuration sets up Nginx as a reverse proxy for the JODDB application
# with support for both frontend and backend services with HTTPS/HTTP2 support.

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# HTTP redirect to HTTPS (commented by default for development)
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL Configuration
    ssl_certificate SSL_CERT_PLACEHOLDER;
    ssl_certificate_key SSL_KEY_PLACEHOLDER;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;

    # Logging
    access_log /var/log/nginx/joddb_access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/joddb_error.log warn;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;

    # Client body size limit
    client_max_body_size 100M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # ============================================================================
    # FRONTEND Configuration
    # ============================================================================
    location / {
        # Frontend SPA serving
        proxy_pass http://localhost:FRONTEND_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Caching for static assets
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ============================================================================
    # BACKEND API Configuration
    # ============================================================================
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

        # Disable caching for API responses
        proxy_cache_bypass $http_pragma $http_authorization;
        add_header Cache-Control "no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";

        # API timeout settings (longer for file operations)
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # ============================================================================
    # ADMIN Configuration
    # ============================================================================
    location /admin/ {
        limit_req zone=general_limit burst=10 nodelay;

        proxy_pass http://localhost:BACKEND_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Disable caching
        add_header Cache-Control "no-store, must-revalidate";
    }

    # ============================================================================
    # STATIC FILES Configuration
    # ============================================================================
    location /static/ {
        alias /home/coderx64/hackathon/backend/staticfiles/;

        # Caching for static files
        expires 30d;
        add_header Cache-Control "public, immutable";

        # Gzip compression
        gzip_static on;

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
    }

    # ============================================================================
    # MEDIA FILES Configuration
    # ============================================================================
    location /media/ {
        alias /home/coderx64/hackathon/backend/media/;

        # Caching for media files
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
    }

    # ============================================================================
    # HEALTH CHECK
    # ============================================================================
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # ============================================================================
    # BLOCK SENSITIVE FILES
    # ============================================================================
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX_CONFIG

# Replace placeholders with actual values
sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|SSL_CERT_PLACEHOLDER|${SSL_CERT}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|SSL_KEY_PLACEHOLDER|${SSL_KEY}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|BACKEND_PORT_PLACEHOLDER|${BACKEND_PORT}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"
sed -i "s|FRONTEND_PORT_PLACEHOLDER|${FRONTEND_PORT}|g" "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}"

echo -e "${GREEN}✅ Nginx configuration created${NC}"
echo -e "${YELLOW}   Location: ${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}\n"

# Step 6: Enable the site
echo -e "${YELLOW}[6/7]${NC} Enabling Nginx configuration..."

# Remove default site if it exists
if [ -L "${NGINX_ENABLED_DIR}/default" ]; then
    rm "${NGINX_ENABLED_DIR}/default"
fi

# Create symlink if it doesn't exist
if [ ! -L "${NGINX_ENABLED_DIR}/${NGINX_CONF_NAME}" ]; then
    ln -s "${NGINX_SITES_DIR}/${NGINX_CONF_NAME}" "${NGINX_ENABLED_DIR}/${NGINX_CONF_NAME}"
    echo -e "${GREEN}✅ Site enabled${NC}"
else
    echo -e "${YELLOW}   Site already enabled${NC}"
fi

# Test Nginx configuration
echo -e "${YELLOW}   Testing Nginx configuration...${NC}"
nginx -t 2>&1 | grep -q "successful" && \
echo -e "${GREEN}✅ Configuration test passed${NC}" || \
{
    echo -e "${RED}❌ Configuration test failed${NC}"
    echo -e "${YELLOW}   Please review the configuration at: ${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}"
    exit 1
}
echo ""

# Step 7: Start/Restart Nginx
echo -e "${YELLOW}[7/7]${NC} Starting Nginx service..."

if systemctl is-active --quiet nginx; then
    echo -e "${YELLOW}   Restarting Nginx...${NC}"
    systemctl restart nginx
    sleep 2
    systemctl is-active --quiet nginx && \
    echo -e "${GREEN}✅ Nginx restarted successfully${NC}" || \
    echo -e "${RED}❌ Failed to restart Nginx${NC}"
else
    echo -e "${YELLOW}   Starting Nginx...${NC}"
    systemctl start nginx
    sleep 2
    systemctl is-active --quiet nginx && \
    echo -e "${GREEN}✅ Nginx started successfully${NC}" || \
    echo -e "${RED}❌ Failed to start Nginx${NC}"
fi

# Enable Nginx to start on boot
systemctl enable nginx > /dev/null 2>&1
echo -e "${GREEN}✅ Nginx enabled for auto-start${NC}\n"

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Nginx Production Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Configuration Summary:${NC}"
echo -e "  Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "  Backend Port: ${GREEN}${BACKEND_PORT}${NC}"
echo -e "  Frontend Port: ${GREEN}${FRONTEND_PORT}${NC}"
echo -e "  Config File: ${GREEN}${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}"
echo -e "  SSL Cert: ${GREEN}${SSL_CERT}${NC}"
echo -e "  SSL Key: ${GREEN}${SSL_KEY}${NC}\n"

echo -e "${YELLOW}Verification Commands:${NC}"
echo -e "  ${GREEN}sudo systemctl status nginx${NC}"
echo -e "  ${GREEN}sudo nginx -T${NC}"
echo -e "  ${GREEN}sudo tail -f /var/log/nginx/joddb_error.log${NC}"
echo -e "  ${GREEN}sudo tail -f /var/log/nginx/joddb_access.log${NC}\n"

echo -e "${YELLOW}SSL Certificate Update:${NC}"
if [ "$USE_SELF_SIGNED" = "true" ] || [ ! -f "$SSL_CERT" ]; then
    echo -e "  ${CYAN}Current: Self-signed certificate (for testing only)${NC}"
    echo -e "  ${CYAN}For production, use Let's Encrypt:${NC}"
    echo -e "  ${GREEN}sudo apt-get install certbot python3-certbot-nginx${NC}"
    echo -e "  ${GREEN}sudo certbot certonly --standalone -d ${DOMAIN}${NC}"
    echo -e "  ${GREEN}sudo sed -i 's|/etc/nginx/certs/joddb.crt|/etc/letsencrypt/live/${DOMAIN}/fullchain.pem|g' ${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}"
    echo -e "  ${GREEN}sudo sed -i 's|/etc/nginx/certs/joddb.key|/etc/letsencrypt/live/${DOMAIN}/privkey.pem|g' ${NGINX_SITES_DIR}/${NGINX_CONF_NAME}${NC}"
    echo -e "  ${GREEN}sudo systemctl restart nginx${NC}\n"
else
    echo -e "  ${GREEN}Using: ${SSL_CERT}${NC}"
    echo -e "  ${GREEN}Auto-renewal: Set up Certbot renewal cron job${NC}\n"
fi

echo -e "${YELLOW}Testing:${NC}"
echo -e "  ${GREEN}curl https://${DOMAIN}/health${NC}\n"

echo -e "${YELLOW}Troubleshooting:${NC}"
echo -e "  See: ${SCRIPT_DIR}/NGINX_SETUP_GUIDE.md\n"
