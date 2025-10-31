# core/management/commands/seed_tasks_with_types.py
from django.core.management.base import BaseCommand
from core.models import Task, JobOrder, Device
from datetime import timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seeds the database with tasks of different types (technician, quality, tester)'

    def handle(self, *args, **kwargs):
        # Get or create a job order
        job_order = JobOrder.objects.first()
        if not job_order:
            self.stdout.write(self.style.ERROR('No job orders found. Please create one first.'))
            return
        
        # Get or create a device
        device = Device.objects.first()
        if not device:
            self.stdout.write(self.style.ERROR('No devices found. Please create one first.'))
            return
        
        # Sample tasks with different types
        tasks_data = [
            {
                'operation_name': 'Assembly Component A',
                'task_type': 'technician',
                'standard_time_seconds': 3600,  # 1 hour
            },
            {
                'operation_name': 'Quality Inspection',
                'task_type': 'quality',
                'standard_time_seconds': 1800,  # 30 minutes
            },
            {
                'operation_name': 'Testing Protocol',
                'task_type': 'tester',
                'standard_time_seconds': 2400,  # 40 minutes
            },
            {
                'operation_name': 'Assembly Component B',
                'task_type': 'technician',
                'standard_time_seconds': 3000,  # 50 minutes
            },
            {
                'operation_name': 'Final Testing',
                'task_type': 'tester',
                'standard_time_seconds': 1200,  # 20 minutes
            },
        ]
        
        for task_data in tasks_data:
            task, created = Task.objects.get_or_create(
                device=device,
                job_order=job_order,
                operation_name=task_data['operation_name'],
                task_type=task_data['task_type'],
                defaults={
                    'standard_time_seconds': task_data['standard_time_seconds'],
                    'status': 'available',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'Created {task_data["task_type"]} task: {task_data["operation_name"]}'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Task already exists: {task_data["operation_name"]}'
                ))
