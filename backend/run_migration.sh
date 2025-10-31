#!/bin/bash
# Run this to create and apply the migration

cd /sgoinfre/amsaleh/hackathon/backend

# Create migration
python manage.py makemigrations core

# Apply migration
python manage.py migrate

echo "✅ Migration complete - Tester role added"