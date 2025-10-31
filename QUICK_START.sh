#!/bin/bash

# JODDB Backend - Quick Start Script
# Provides easy commands for common operations

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     JODDB Backend - Quick Start Menu      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Available Commands:${NC}\n"
echo "1. Start Backend Server"
echo "2. Run Migrations"
echo "3. Seed Database"
echo "4. Clear and Reseed Database"
echo "5. Create Superuser"
echo "6. Check Django Setup"
echo "7. Access Database Shell"
echo "8. Show Database Stats"
echo "9. View Test User Credentials"
echo "10. Exit\n"

read -p "Select option (1-10): " choice

case $choice in
    1)
        echo -e "${GREEN}Starting Backend Server...${NC}\n"
        bash run-backend-prod.sh
        ;;
    2)
        echo -e "${GREEN}Running Migrations...${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py migrate
        deactivate
        ;;
    3)
        echo -e "${GREEN}Seeding Database...${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py seed_database
        deactivate
        ;;
    4)
        echo -e "${YELLOW}This will clear all data and reseed. Continue? (y/n)${NC}"
        read -p "? " confirm
        if [[ $confirm == "y" ]]; then
            echo -e "${GREEN}Clearing and Reseeding Database...${NC}\n"
            cd backend
            source venv/bin/activate
            export $(cat .env | grep -v '^#' | xargs)
            python manage.py seed_database --clear
            deactivate
        fi
        ;;
    5)
        echo -e "${GREEN}Creating Django Superuser...${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py createsuperuser
        deactivate
        ;;
    6)
        echo -e "${GREEN}Running Django System Checks...${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py check
        deactivate
        ;;
    7)
        echo -e "${GREEN}Accessing Database Shell...${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py dbshell
        deactivate
        ;;
    8)
        echo -e "${GREEN}Database Statistics:${NC}\n"
        cd backend
        source venv/bin/activate
        export $(cat .env | grep -v '^#' | xargs)
        python manage.py shell << PYEOF
from core.models import User, Job, JobOrder, Device, Task
print(f'�� Users: {User.objects.count()}')
print(f'📋 Jobs: {Job.objects.count()}')
print(f'🎯 Job Orders: {JobOrder.objects.count()}')
print(f'📱 Devices: {Device.objects.count()}')
print(f'📍 Tasks: {Task.objects.count()}')
PYEOF
        deactivate
        ;;
    9)
        echo -e "${GREEN}Test User Credentials:${NC}\n"
        echo "┌─────────────────────────────────────┐"
        echo "│ Username     │ Password   │ Role    │"
        echo "├─────────────────────────────────────┤"
        echo "│ admin        │ admin123   │ Admin   │"
        echo "│ tech1/2/3    │ tech123    │ Tech    │"
        echo "│ qa1/2        │ qa123      │ QA      │"
        echo "│ tester1      │ tester123  │ Tester  │"
        echo "│ supervisor1  │ sup123     │ Sup     │"
        echo "│ planner1     │ plan123    │ Planner │"
        echo "└─────────────────────────────────────┘"
        ;;
    10)
        echo -e "${GREEN}Goodbye! 👋${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Invalid option. Please select 1-10.${NC}"
        ;;
esac

echo -e "\n${BLUE}Done! 🎉${NC}\n"
