"""
Management command to seed the database with sample data.
Used for production and development setup.

Usage: python manage.py seed_database
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Job, Process, User, JobOrder, Device, Task, Report
import random


class Command(BaseCommand):
    help = 'Seed the database with sample data for testing and development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('Starting Database Seeding'))
        self.stdout.write(self.style.SUCCESS('='*60))

        if options['clear']:
            self.clear_database()

        self.seed_users()
        self.seed_jobs()
        self.seed_job_orders()

        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(self.style.SUCCESS('✅ Database seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))

    def clear_database(self):
        """Clear all data from tables"""
        self.stdout.write(self.style.WARNING('\n🗑️  Clearing existing data...'))
        
        Job.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        JobOrder.objects.all().delete()
        Device.objects.all().delete()
        Task.objects.all().delete()
        Report.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('✅ Database cleared'))

    def seed_users(self):
        """Create sample users with different roles"""
        self.stdout.write(self.style.WARNING('\n👥 Creating users...'))

        users_data = [
            {
                'username': 'admin',
                'email': 'admin@joddb.local',
                'full_name': 'System Administrator',
                'role': 'admin',
                'password': 'admin123'
            },
            {
                'username': 'supervisor1',
                'email': 'supervisor1@joddb.local',
                'full_name': 'John Supervisor',
                'role': 'supervisor',
                'password': 'supervisor123'
            },
            {
                'username': 'planner1',
                'email': 'planner1@joddb.local',
                'full_name': 'Planning Engineer',
                'role': 'planning',
                'password': 'planner123'
            },
            {
                'username': 'tech1',
                'email': 'tech1@joddb.local',
                'full_name': 'Ahmed Technician',
                'role': 'technician',
                'password': 'tech123'
            },
            {
                'username': 'tech2',
                'email': 'tech2@joddb.local',
                'full_name': 'Fatima Technician',
                'role': 'technician',
                'password': 'tech123'
            },
            {
                'username': 'tech3',
                'email': 'tech3@joddb.local',
                'full_name': 'Mohammad Technician',
                'role': 'technician',
                'password': 'tech123'
            },
            {
                'username': 'qa1',
                'email': 'qa1@joddb.local',
                'full_name': 'Quality Inspector',
                'role': 'quality',
                'password': 'qa123'
            },
            {
                'username': 'qa2',
                'email': 'qa2@joddb.local',
                'full_name': 'Quality Assurance',
                'role': 'quality',
                'password': 'qa123'
            },
            {
                'username': 'tester1',
                'email': 'tester1@joddb.local',
                'full_name': 'Final Tester',
                'role': 'tester',
                'password': 'tester123'
            },
        ]

        created_count = 0
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'full_name': user_data['full_name'],
                    'role': user_data['role'],
                    'is_active': True,
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✅ Created user: {user_data['username']} ({user_data['role']})")
                )
            else:
                self.stdout.write(f"  ⏭️  User already exists: {user_data['username']}")

        self.stdout.write(self.style.SUCCESS(f'\n✅ Users created: {created_count}'))

    def seed_jobs(self):
        """Create sample job templates with processes"""
        self.stdout.write(self.style.WARNING('\n📋 Creating job templates...'))

        jobs_data = [
            {
                'name': 'iPhone 15 Assembly',
                'description': 'Complete assembly and testing process for iPhone 15',
                'processes': [
                    {'operation_name': 'Component Inspection', 'standard_time_seconds': 300, 'task_type': 'quality', 'order': 1},
                    {'operation_name': 'PCB Assembly', 'standard_time_seconds': 900, 'task_type': 'technician', 'order': 2},
                    {'operation_name': 'Display Module Installation', 'standard_time_seconds': 600, 'task_type': 'technician', 'order': 3},
                    {'operation_name': 'Battery Installation', 'standard_time_seconds': 300, 'task_type': 'technician', 'order': 4},
                    {'operation_name': 'Quality Inspection', 'standard_time_seconds': 450, 'task_type': 'quality', 'order': 5},
                    {'operation_name': 'Final Testing', 'standard_time_seconds': 600, 'task_type': 'tester', 'order': 6},
                ]
            },
            {
                'name': 'Samsung Galaxy Repair',
                'description': 'Repair and refurbishment process for Samsung Galaxy devices',
                'processes': [
                    {'operation_name': 'Damage Assessment', 'standard_time_seconds': 300, 'task_type': 'quality', 'order': 1},
                    {'operation_name': 'Component Replacement', 'standard_time_seconds': 1200, 'task_type': 'technician', 'order': 2},
                    {'operation_name': 'Software Installation', 'standard_time_seconds': 600, 'task_type': 'technician', 'order': 3},
                    {'operation_name': 'Functionality Test', 'standard_time_seconds': 450, 'task_type': 'tester', 'order': 4},
                ]
            },
            {
                'name': 'Laptop Testing',
                'description': 'Comprehensive testing and quality assurance for laptops',
                'processes': [
                    {'operation_name': 'Hardware Verification', 'standard_time_seconds': 600, 'task_type': 'technician', 'order': 1},
                    {'operation_name': 'Performance Testing', 'standard_time_seconds': 900, 'task_type': 'tester', 'order': 2},
                    {'operation_name': 'Quality Check', 'standard_time_seconds': 450, 'task_type': 'quality', 'order': 3},
                ]
            },
        ]

        created_jobs = 0
        for job_data in jobs_data:
            job, created = Job.objects.get_or_create(
                name=job_data['name'],
                defaults={'description': job_data['description']}
            )
            
            if created:
                created_jobs += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ Created job: {job_data['name']}"))

            # Create processes
            for process_data in job_data['processes']:
                Process.objects.get_or_create(
                    job=job,
                    order=process_data['order'],
                    defaults={
                        'operation_name': process_data['operation_name'],
                        'standard_time_seconds': process_data['standard_time_seconds'],
                        'task_type': process_data['task_type'],
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'\n✅ Jobs and processes created'))

    def seed_job_orders(self):
        """Create sample job orders with devices and tasks"""
        self.stdout.write(self.style.WARNING('\n📦 Creating job orders...'))

        jobs = Job.objects.all()
        users_technician = User.objects.filter(role='technician')
        planner = User.objects.filter(role='planning').first()

        if not planner:
            self.stdout.write(self.style.WARNING('  ⚠️  No planning user found, skipping job orders'))
            return

        job_orders_count = 0
        
        for job in jobs:
            for i in range(2):  # Create 2 job orders per job
                order_code = f"{job.name.upper().replace(' ', '')[:3]}-{timezone.now().strftime('%Y%m%d')}-{i+1:03d}"
                
                job_order, created = JobOrder.objects.get_or_create(
                    order_code=order_code,
                    defaults={
                        'job': job,
                        'title': f"{job.name} - Batch {i+1}",
                        'description': f"Production batch for {job.name}",
                        'total_devices': random.randint(5, 20),
                        'due_date': timezone.now().date() + timedelta(days=random.randint(5, 30)),
                        'created_by': planner,
                        'status': random.choice(['available', 'in_progress', 'done']),
                    }
                )

                if created:
                    job_orders_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✅ Created job order: {order_code}")
                    )

                    # Create devices for this order
                    for device_idx in range(job_order.total_devices):
                        serial_number = f"SN-{order_code}-{device_idx+1:03d}"
                        Device.objects.get_or_create(
                            serial_number=serial_number,
                            defaults={
                                'job_order': job_order,
                                'current_status': random.choice(['pending', 'in_progress', 'completed']),
                            }
                        )

                    # Create tasks for this order
                    processes = job.processes.all().order_by('order')
                    devices = job_order.devices.all()

                    for process in processes:
                        for device in devices[:3]:  # Assign to first 3 devices
                            assigned_tech = random.choice(users_technician)
                            
                            Task.objects.get_or_create(
                                job_order=job_order,
                                device=device,
                                process=process,
                                defaults={
                                    'operation_name': process.operation_name,
                                    'standard_time_seconds': process.standard_time_seconds,
                                    'task_type': process.task_type,
                                    'technician': assigned_tech if process.task_type == 'technician' else None,
                                    'status': random.choice(['available', 'in_progress', 'done', 'completed']),
                                    'start_time': timezone.now() - timedelta(hours=random.randint(1, 48)) if random.random() > 0.5 else None,
                                    'end_time': timezone.now() if random.random() > 0.7 else None,
                                }
                            )

        self.stdout.write(self.style.SUCCESS(f'\n✅ Job orders and devices created: {job_orders_count}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Total devices created: {Device.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Total tasks created: {Task.objects.count()}'))
