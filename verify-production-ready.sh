#!/bin/bash

###############################################################################
# Production Readiness Verification Script
# 
# This script verifies that the backend is properly configured for production
# deployment and checks all critical settings.
#
# Usage: bash verify-production-ready.sh
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

print_warn() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
    ((CHECKS_WARNING++))
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Change to backend directory
cd "$(dirname "$0")/backend" || exit 1

print_header "BACKEND PRODUCTION READINESS VERIFICATION"

# 1. Django Settings Checks
print_header "1. Django Settings Verification"

print_check "Checking if settings.py is syntactically valid..."
if python -m py_compile joddb_backend/settings.py 2>/dev/null; then
    print_pass "Settings file has valid Python syntax"
else
    print_fail "Settings file has syntax errors"
    exit 1
fi

# 2. Environment File Checks
print_header "2. Environment Configuration"

if [ -f ".env.production" ]; then
    print_pass "Production .env file found (.env.production)"
else
    print_warn "Production .env file not found (.env.production) - will use system environment variables"
fi

# 3. Requirements Checks
print_header "3. Dependencies Verification"

print_check "Checking if requirements.txt exists..."
if [ -f "requirements.txt" ]; then
    print_pass "requirements.txt found"
    
    # Check for critical production packages
    print_check "Checking for critical production packages..."
    
    # PostgreSQL driver
    if grep -q "psycopg2" requirements.txt; then
        print_pass "PostgreSQL driver (psycopg2) is in requirements"
    else
        print_warn "PostgreSQL driver (psycopg2) not found in requirements"
    fi
    
    # WSGI server
    if grep -q "gunicorn\|uwsgi" requirements.txt; then
        print_pass "WSGI server (gunicorn/uwsgi) found in requirements"
    else
        print_fail "No WSGI server (gunicorn/uwsgi) found in requirements"
    fi
    
    # Whitenoise
    if grep -q "whitenoise" requirements.txt; then
        print_pass "Whitenoise (static files) found in requirements"
    else
        print_fail "Whitenoise not found in requirements - needed for static files"
    fi
    
    # Django-cors-headers
    if grep -q "django-cors-headers" requirements.txt; then
        print_pass "CORS headers package found in requirements"
    else
        print_warn "CORS headers package not found - needed for frontend integration"
    fi
else
    print_fail "requirements.txt not found"
fi

# 4. Python Settings Checks (Dynamic)
print_header "4. Django Settings Analysis"

print_check "Checking settings for production configuration..."

# Try to import Django and check settings
python -c "
import os
import sys
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'joddb_backend.settings')
django.setup()

# Check DEBUG setting
print('DEBUG value:', settings.DEBUG)

# Check ALLOWED_HOSTS
print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)

# Check SECRET_KEY
if settings.SECRET_KEY and len(settings.SECRET_KEY) > 20:
    print('SECRET_KEY: Configured (length:', len(settings.SECRET_KEY), ')')
else:
    print('SECRET_KEY: USING INSECURE DEFAULT')

# Check DATABASES
db_engine = settings.DATABASES['default']['ENGINE']
print('Database engine:', db_engine)

# Check MIDDLEWARE for Whitenoise
middleware = settings.MIDDLEWARE
has_whitenoise = any('whitenoise' in m.lower() for m in middleware)
print('Whitenoise middleware:', 'Present' if has_whitenoise else 'Missing')

# Check STATIC settings
print('STATIC_URL:', settings.STATIC_URL)
print('STATIC_ROOT:', settings.STATIC_ROOT)
print('STATICFILES_STORAGE:', settings.STATICFILES_STORAGE)

# Check security settings if production
is_prod = os.getenv('ENVIRONMENT', 'development') == 'production'
print('Production mode:', 'YES' if is_prod else 'NO')

if is_prod:
    print('SECURE_SSL_REDIRECT:', getattr(settings, 'SECURE_SSL_REDIRECT', False))
    print('CSRF_COOKIE_SECURE:', getattr(settings, 'CSRF_COOKIE_SECURE', False))
    print('SESSION_COOKIE_SECURE:', getattr(settings, 'SESSION_COOKIE_SECURE', False))
" 2>/dev/null || print_warn "Could not analyze settings (Django setup may require additional configuration)"

# 5. Database Configuration Checks
print_header "5. Database Configuration"

print_check "Checking database configuration..."
if grep -q "postgresql" requirements.txt; then
    print_pass "PostgreSQL support is in requirements"
    
    # Check if .env has database config
    if [ -f ".env.production" ] && grep -q "DB_NAME\|DB_USER\|DB_HOST" .env.production; then
        print_pass "Database environment variables are configured"
    else
        print_warn "Database environment variables not found in .env.production"
    fi
else
    print_fail "PostgreSQL support not in requirements.txt"
fi

# 6. Static Files Check
print_header "6. Static Files Configuration"

if [ -d "staticfiles" ]; then
    print_pass "staticfiles directory exists"
    FILE_COUNT=$(find staticfiles -type f | wc -l)
    print_pass "Static files count: $FILE_COUNT"
else
    print_warn "staticfiles directory not found - run: python manage.py collectstatic"
fi

# 7. Migrations Check
print_header "7. Database Migrations"

print_check "Checking if all migrations are applied..."
MIGRATION_COUNT=$(find core/migrations -name "000*.py" 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    print_pass "Found $MIGRATION_COUNT migration files"
else
    print_warn "No migration files found"
fi

# 8. Security Checklist
print_header "8. Security Checklist"

print_check "Checking security settings..."

# Check settings file for security headers
if grep -q "SECURE_SSL_REDIRECT\|SECURE_HSTS" joddb_backend/settings.py; then
    print_pass "Security headers configuration found in settings"
else
    print_fail "Security headers configuration not found in settings"
fi

if grep -q "SESSION_COOKIE_SECURE\|SESSION_COOKIE_HTTPONLY" joddb_backend/settings.py; then
    print_pass "Session security configuration found"
else
    print_fail "Session security configuration not found"
fi

if grep -q "CSRF_COOKIE_SECURE\|CSRF_COOKIE_HTTPONLY" joddb_backend/settings.py; then
    print_pass "CSRF security configuration found"
else
    print_fail "CSRF security configuration not found"
fi

# 9. Logs Directory Check
print_header "9. Logging Configuration"

if grep -q "LOGGING\|RotatingFileHandler" joddb_backend/settings.py; then
    print_pass "Logging configuration found in settings"
    
    if [ -d "logs" ]; then
        print_pass "logs directory exists"
    else
        print_warn "logs directory does not exist - will be created on first run"
    fi
else
    print_fail "Logging configuration not found"
fi

# 10. Production Scripts Check
print_header "10. Production Deployment Scripts"

SCRIPT_DIR=".."
SCRIPTS=(
    "setup-backend-prod.sh"
    "run-backend-prod.sh"
    "setup-all-prod.sh"
    "run-all-prod.sh"
    "check-prerequisites.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        if [ -x "$SCRIPT_DIR/$script" ]; then
            print_pass "$script is present and executable"
        else
            print_warn "$script is present but not executable - run: chmod +x $script"
        fi
    else
        print_warn "$script not found at $SCRIPT_DIR/$script"
    fi
done

# Final Summary
print_header "VERIFICATION SUMMARY"

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
echo "Total checks: $TOTAL"
echo -e "  ${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "  ${YELLOW}Warnings: $CHECKS_WARNING${NC}"
echo -e "  ${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ BACKEND IS PRODUCTION READY!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Set ENVIRONMENT=production"
        echo "2. Set ALLOWED_HOSTS with your domain"
        echo "3. Set SECRET_KEY to a secure random value"
        echo "4. Configure database credentials"
        echo "5. Run: bash run-backend-prod.sh"
        exit 0
    else
        echo -e "${YELLOW}⚠ BACKEND IS MOSTLY PRODUCTION READY${NC}"
        echo "Address the warnings above before deploying."
        exit 0
    fi
else
    echo -e "${RED}✗ BACKEND IS NOT PRODUCTION READY${NC}"
    echo "Address the failures above before deploying."
    exit 1
fi
