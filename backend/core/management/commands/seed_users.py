# core/management/commands/seed_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User
import secrets
import string


class Command(BaseCommand):
    help = 'Seeds the database with sample users for testing'

    def generate_secure_password(self, length=16):
        """Generate a secure random password"""
        characters = string.ascii_letters + string.digits + string.punctuation.replace("'", "").replace('"', '')
        return ''.join(secrets.choice(characters) for _ in range(length))

    def handle(self, *args, **kwargs):
        users_data = [
            {'username': 'pe_1', 'email': 'pe1@joddb.local', 'first_name': 'Ahmed', 
             'last_name': 'Planning', 'role': 'planning', 'is_staff': True},
            {'username': 'super_1', 'email': 'super1@joddb.local', 'first_name': 'Youssef',
             'last_name': 'Supervisor', 'role': 'supervisor', 'is_staff': True},
            {'username': 'qi_1', 'email': 'qi1@joddb.local', 'first_name': 'Fatima',
             'last_name': 'Quality', 'role': 'quality'},
            {'username': 'tech_1', 'email': 'tech1@joddb.local', 'first_name': 'Ali',
             'last_name': 'Technician', 'role': 'technician'},
            {'username': 'tech_2', 'email': 'tech2@joddb.local', 'first_name': 'Omar',
             'last_name': 'Technician', 'role': 'technician'},
            {'username': 'tester_1', 'email': 'tester1@joddb.local', 'first_name': 'Sara',
             'last_name': 'Tester', 'role': 'tester'},
            {'username': 'admin', 'email': 'admin@joddb.local', 'first_name': 'System',
             'last_name': 'Admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
        ]
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('SEEDING DATABASE WITH USERS'))
        self.stdout.write('='*60 + '\n')

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                # Generate secure random password
                secure_password = "pass"
                user.set_password(secure_password)
                user.full_name = f"{user_data['first_name']} {user_data['last_name']}"
                user.save()
                
                # Log the credentials
                self.stdout.write(self.style.SUCCESS(f'✓ Created user: {user.username}'))
                self.stdout.write(f'  Email: {user_data["email"]}')
                self.stdout.write(f'  Role: {user_data["role"]}')
                self.stdout.write(f'  Password: {secure_password}\n')
            else:
                self.stdout.write(self.style.WARNING(f'⚠ User already exists: {user.username}'))
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.WARNING(
            'IMPORTANT: Save the generated passwords in a secure location.\n'
            'These credentials are shown only during initial seed operation.\n'
            'Do not commit passwords to version control.'
        ))
        self.stdout.write('='*60 + '\n')