# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import JobOrder, Device, Task, Process

@receiver(post_save, sender=JobOrder)
def create_devices_and_tasks_for_job_order(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create devices and their corresponding tasks
    when a new JobOrder is created.
    """
    if created and instance.job:
        # This is a new JobOrder, and it has an associated job template.
        
        # 1. Get all the predefined processes for this job, in order.
        processes = Process.objects.filter(job=instance.job).order_by('order')
        
        if not processes.exists():
            # No processes defined for this job, so nothing to do.
            return

        # 2. Create the specified number of devices for this job order.
        devices_to_create = []
        for i in range(instance.total_devices):
            serial_number = f"{instance.order_code}-{i + 1:04d}"
            devices_to_create.append(
                Device(job_order=instance, serial_number=serial_number)
            )
        
        # Bulk create devices for efficiency
        created_devices = Device.objects.bulk_create(devices_to_create)

        # 3. For each created device, create all the necessary tasks.
        tasks_to_create = []
        for device in created_devices:
            for process in processes:
                tasks_to_create.append(
                    Task(
                        job_order=instance,
                        device=device,
                        process=process,
                        operation_name=process.operation_name,
                        standard_time_seconds=process.standard_time_seconds,
                        task_type=process.task_type,
                        status='available'
                    )
                )
        
        # Bulk create tasks for efficiency
        Task.objects.bulk_create(tasks_to_create)
