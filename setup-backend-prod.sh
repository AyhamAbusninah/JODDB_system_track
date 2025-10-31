#!/bin/bash

################################################################################
# JODDB Backend Production Setup Script
# =======================================
# This script sets up the Django backend for production deployment with:
# - PostgreSQL database configuration
# - Environment variables setup
# - Virtual environment creation
# - Dependencies installation
# - Database migrations
# - Static files collection
# - Gunicorn installation
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/backend" && pwd)"
VENV_DIR="${BACKEND_DIR}/venv"
ENV_FILE="${BACKEND_DIR}/.env"
PYTHON_VERSION="3.10"

# Database Configuration (defaults - can be overridden via environment)
DB_NAME="${DB_NAME:-joddb_prod}"
DB_USER="${DB_USER:-joddb_user}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 16)}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
SECRET_KEY="${SECRET_KEY:-$(openssl rand -base64 50)}"
ALLOWED_HOSTS="${ALLOWED_HOSTS:-localhost,127.0.0.1}"
DEBUG="${DEBUG:-False}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JODDB Backend Production Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Check Python installation
echo -e "${YELLOW}[1/8]${NC} Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✅ Python ${PYTHON_VERSION} found${NC}\n"

# Step 2: Check PostgreSQL installation
echo -e "${YELLOW}[2/8]${NC} Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL.${NC}"
    echo -e "${YELLOW}   Installation guide: https://www.postgresql.org/download/${NC}"
    exit 1
fi
PG_VERSION=$(psql --version | awk '{print $3}')
echo -e "${GREEN}✅ PostgreSQL ${PG_VERSION} found${NC}\n"

# Step 3: Create virtual environment
echo -e "${YELLOW}[3/8]${NC} Creating virtual environment..."
if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}   Virtual environment already exists, skipping...${NC}"
else
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi
source "$VENV_DIR/bin/activate"
echo -e "${GREEN}✅ Virtual environment activated${NC}\n"

# Step 4: Upgrade pip and install dependencies
echo -e "${YELLOW}[4/8]${NC} Installing Python dependencies..."
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install -r "${BACKEND_DIR}/requirements.txt" > /dev/null 2>&1

# Install production server
pip install gunicorn > /dev/null 2>&1
pip install whitenoise > /dev/null 2>&1  # For static file serving

echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Step 5: Create .env file for production
echo -e "${YELLOW}[5/8]${NC} Creating .env configuration file..."

cat > "$ENV_FILE" << EOF
# Django Configuration
ENVIRONMENT=production
SECRET_KEY=$SECRET_KEY
DEBUG=$DEBUG
ALLOWED_HOSTS=$ALLOWED_HOSTS

# Database Configuration (PostgreSQL - REQUIRED for production)
USE_POSTGRESQL=True
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_CONN_MAX_AGE=600

# Security (HTTPS Configuration - Enable in production with valid SSL certificate)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://localhost:5173,https://yourdomain.com,https://www.yourdomain.com

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

echo -e "${GREEN}✅ .env file created at ${ENV_FILE}${NC}"
echo -e "${YELLOW}   ⚠️  IMPORTANT: Update .env with your actual database credentials!${NC}"
echo -e "${YELLOW}       - DB_PASSWORD, DB_USER, SECRET_KEY should be changed${NC}\n"

# Step 6: Create PostgreSQL database and user
echo -e "${YELLOW}[6/8]${NC} Setting up PostgreSQL database..."
echo -e "${YELLOW}   Note: Setting up database: $DB_NAME${NC}"

# Create database user if it doesn't exist
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1; then
    echo -e "${YELLOW}   User '$DB_USER' already exists${NC}"
else
    echo -e "${YELLOW}   Creating database user: $DB_USER${NC}"
    sudo -u postgres createuser "$DB_USER" 2>/dev/null || {
        echo -e "${RED}❌ Failed to create user automatically${NC}"
        echo -e "${YELLOW}   Please create manually:${NC}"
        echo -e "${YELLOW}   $ sudo -u postgres psql${NC}"
        echo -e "${YELLOW}   # CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';${NC}"
        exit 1
    }
    
    # Set password for the user
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
        echo -e "${RED}❌ Failed to set password${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ User '$DB_USER' created${NC}"
fi

# Create database if it doesn't exist
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}   Database '$DB_NAME' already exists${NC}"
else
    echo -e "${YELLOW}   Creating database: $DB_NAME${NC}"
    sudo -u postgres createdb "$DB_NAME" -O "$DB_USER" 2>/dev/null || {
        echo -e "${RED}❌ Failed to create database automatically${NC}"
        echo -e "${YELLOW}   Please create manually:${NC}"
        echo -e "${YELLOW}   $ sudo -u postgres psql${NC}"
        echo -e "${YELLOW}   # CREATE DATABASE $DB_NAME OWNER $DB_USER;${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Database '$DB_NAME' created${NC}"
fi

# Grant privileges
echo -e "${YELLOW}   Granting privileges...${NC}"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;" 2>/dev/null || true

# Verify connection
echo -e "${YELLOW}   Verifying database connection...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -h localhost -c "SELECT version();" > /dev/null 2>&1 && \
echo -e "${GREEN}✅ Database connection verified${NC}" || \
echo -e "${YELLOW}   ⚠️  Could not verify connection (this may be normal on first setup)${NC}"

echo -e "${GREEN}✅ PostgreSQL setup complete${NC}\n"

# Step 7: Run database migrations
echo -e "${YELLOW}[7/8]${NC} Running database migrations..."
cd "$BACKEND_DIR"
python manage.py migrate --noinput > /dev/null 2>&1
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 7b: Seed database with sample data
echo -e "${YELLOW}[7b/8]${NC} Seeding database with sample data..."
python manage.py seed_database > /dev/null 2>&1
echo -e "${GREEN}✅ Database seeded with sample data${NC}\n"

# Step 8: Collect static files
echo -e "${YELLOW}[8/8]${NC} Collecting static files..."
python manage.py collectstatic --noinput > /dev/null 2>&1
echo -e "${GREEN}✅ Static files collected${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Backend Production Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review and update .env file: ${GREEN}${ENV_FILE}${NC}"
echo -e "2. Start the backend: ${GREEN}cd $(dirname "$BACKEND_DIR") && bash run-backend-prod.sh${NC}"
echo -e "\n${YELLOW}Database Credentials:${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  User: ${GREEN}$DB_USER${NC}"
echo -e "  Host: ${GREEN}$DB_HOST${NC}"
echo -e "  Port: ${GREEN}$DB_PORT${NC}"
echo -e "\n${YELLOW}To verify setup, run:${NC}"
echo -e "  ${GREEN}source ${VENV_DIR}/bin/activate${NC}"
echo -e "  ${GREEN}cd ${BACKEND_DIR} && python manage.py check${NC}\n"

deactivate
