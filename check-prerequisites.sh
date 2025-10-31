#!/bin/bash

################################################################################
# JODDB Production Installation Checklist
# ========================================
# This script verifies all prerequisites for production deployment
################################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  JODDB Production Prerequisites Check  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Function to check command availability
check_command() {
    local cmd=$1
    local min_version=$2
    
    if command -v "$cmd" &> /dev/null; then
        if [ -z "$min_version" ]; then
            echo -e "${GREEN}✅${NC} $cmd is installed"
            ((CHECKS_PASSED++))
        else
            local version=$(get_version "$cmd")
            if [ "$version" ]; then
                echo -e "${GREEN}✅${NC} $cmd $version (required: $min_version+)"
                ((CHECKS_PASSED++))
            else
                echo -e "${YELLOW}⚠️${NC} $cmd found but version unknown"
                ((CHECKS_WARNING++))
            fi
        fi
        return 0
    else
        echo -e "${RED}❌${NC} $cmd is NOT installed"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to get version
get_version() {
    case $1 in
        python3)
            python3 --version 2>/dev/null | awk '{print $2}'
            ;;
        node)
            node --version 2>/dev/null | sed 's/^v//'
            ;;
        npm)
            npm --version 2>/dev/null
            ;;
        psql)
            psql --version 2>/dev/null | awk '{print $3}'
            ;;
        *)
            echo ""
            ;;
    esac
}

# Function to check directory
check_directory() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $dir exists"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $dir NOT found"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check file
check_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file exists"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $file NOT found"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check writable directory
check_writable() {
    local dir=$1
    if [ -d "$dir" ] && [ -w "$dir" ]; then
        echo -e "${GREEN}✅${NC} $dir is writable"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $dir is NOT writable"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}System Dependencies:${NC}\n"
check_command "bash"
check_command "git"
check_command "curl"
check_command "openssl"

echo -e "\n${YELLOW}Backend Dependencies:${NC}\n"
check_command "python3" "3.8"
check_command "pip3"
check_command "psql" "12"

echo -e "\n${YELLOW}Frontend Dependencies:${NC}\n"
check_command "node" "16"
check_command "npm" "7"

echo -e "\n${YELLOW}Project Structure:${NC}\n"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
check_directory "$SCRIPT_DIR/backend"
check_directory "$SCRIPT_DIR/frontend"
check_file "$SCRIPT_DIR/backend/manage.py"
check_file "$SCRIPT_DIR/frontend/package.json"
check_file "$SCRIPT_DIR/backend/requirements.txt"

echo -e "\n${YELLOW}Writable Directories:${NC}\n"
check_writable "$SCRIPT_DIR/backend"
check_writable "$SCRIPT_DIR/frontend"
mkdir -p /tmp/joddb-logs
check_writable "/tmp/joddb-logs"

echo -e "\n${YELLOW}Production Scripts:${NC}\n"
check_file "$SCRIPT_DIR/setup-backend-prod.sh"
check_file "$SCRIPT_DIR/run-backend-prod.sh"
check_file "$SCRIPT_DIR/setup-frontend-prod.sh"
check_file "$SCRIPT_DIR/run-frontend-prod.sh"
check_file "$SCRIPT_DIR/setup-all-prod.sh"
check_file "$SCRIPT_DIR/run-all-prod.sh"

echo -e "\n${YELLOW}Network Availability:${NC}\n"

# Check if ports are available
for port in 8000 3000 5432; do
    if ! netstat -tuln 2>/dev/null | grep -q ":$port " && \
       ! ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅${NC} Port $port is available"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠️${NC} Port $port is in use"
        ((CHECKS_WARNING++))
    fi
done

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Verification Summary           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

echo -e "Checks Passed:   ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Warnings:        ${YELLOW}${CHECKS_WARNING}${NC}"
echo -e "Checks Failed:   ${RED}${CHECKS_FAILED}${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All prerequisites are met!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "1. Review .env configuration: ${GREEN}nano backend/.env${NC}"
    echo -e "2. Run setup: ${GREEN}bash setup-all-prod.sh${NC}"
    echo -e "3. Start services: ${GREEN}bash run-all-prod.sh${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Some prerequisites are missing!${NC}"
    echo -e "\n${YELLOW}Please install missing dependencies before running setup.${NC}\n"
    exit 1
fi
