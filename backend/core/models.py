# core/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Job(models.Model):
    """
    Represents a predefined job template, like 'iPhone 15 Assembly'.
    This is the parent for a set of processes.
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jobs'
        ordering = ['name']
        verbose_name = 'Job'
        verbose_name_plural = 'Jobs'

    def __str__(self):
        return self.name


class Process(models.Model):
    """
    A predefined process (task template) that belongs to a Job.
    e.g., 'Step 1: Assemble Part A'.
    """
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='processes')
    operation_name = models.CharField(max_length=200)
    standard_time_seconds = models.IntegerField(validators=[MinValueValidator(1)])
    task_type = models.CharField(
        max_length=50,
        choices=[
            ('technician', 'Technician Task'),
            ('quality', 'Quality Inspection Task'),
            ('tester', 'Tester Task'),
        ],
        default='technician'
    )
    order = models.PositiveIntegerField(help_text="The order of this process in the job's workflow.")

    class Meta:
        db_table = 'processes'
        ordering = ['job', 'order']
        unique_together = ('job', 'order')
        verbose_name = 'Process'
        verbose_name_plural = 'Processes'

    def __str__(self):
        return f"{self.job.name} - Step {self.order}: {self.operation_name}"


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds role-based access control field.
    """
    ROLE_CHOICES = [
        ('technician', 'Technician'),
        ('quality', 'Quality Inspector'),
        ('supervisor', 'Supervisor'),
        ('planning', 'Planning Engineer'),
        ('admin', 'System Admin'),
        ('tester', 'Tester'),
    ]
    
    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default='technician',
        db_index=True
    )
    full_name = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class JobOrder(models.Model):
    """
    Job Orders created by Planning Engineers.
    Represents a batch of devices to be assembled.
    """
    job = models.ForeignKey(
        Job,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='job_orders',
        help_text="The predefined job template for this order."
    )
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('rejected', 'Rejected'),
        ('archived', 'Archived'),
    ]
    
    order_code = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    total_devices = models.IntegerField(validators=[MinValueValidator(1)])
    due_date = models.DateField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_job_orders'
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='available',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_orders'
        ordering = ['-created_at']
        verbose_name = 'Job Order'
        verbose_name_plural = 'Job Orders'
    
    def __str__(self):
        return f"{self.order_code} - {self.title}"
    
    def get_progress_percentage(self):
        """Calculate job order completion progress"""
        completed = self.devices.filter(current_status='completed').count()
        if self.total_devices == 0:
            return 0
        return round((completed / self.total_devices) * 100, 2)


class Device(models.Model):
    """
    Individual devices within a Job Order.
    Each has a unique serial number.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name='devices'
    )
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    current_status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'devices'
        ordering = ['serial_number']
        verbose_name = 'Device'
        verbose_name_plural = 'Devices'
    
    def __str__(self):
        return f"{self.serial_number} ({self.job_order.order_code})"


class Task(models.Model):
    """
    Tasks performed by technicians on devices.
    Tracks time, efficiency, and status.
    """
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),  # ← Technician completed the task
        ('pending_qa', 'Pending QA'),  # ← Waiting for QA Inspector approval
        ('qa_approved', 'QA Approved'),  # ← QA Inspector approved, ready for Tester
        ('pending_tester', 'Pending Tester'),  # ← Waiting for Tester final testing
        ('tester_approved', 'Tester Approved'),  # ← Tester approved, ready for Supervisor
        ('pending_supervisor', 'Pending Supervisor'),  # ← Waiting for Supervisor review
        ('supervisor_approved', 'Supervisor Approved'),  # ← Supervisor approved, task complete
        ('rejected', 'Rejected'),  # ← Rejected at any stage, goes back to technician
        ('completed', 'Completed'),  # ← Final completed status
    ]
    
    TASK_TYPE_CHOICES = [
        ('technician', 'Technician Task'),
        ('quality', 'Quality Inspection Task'),
        ('tester', 'Tester Task'),
    ]
    
    process = models.ForeignKey(
        Process,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='tasks',
        help_text="The process template for this task."
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tasks'
    )
    operation_name = models.CharField(max_length=200)
    standard_time_seconds = models.IntegerField(validators=[MinValueValidator(1)])
    
    task_type = models.CharField(
        max_length=50,
        choices=TASK_TYPE_CHOICES,
        default='technician',
        db_index=True
    )
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    actual_time_seconds = models.IntegerField(null=True, blank=True)
    
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='available',
        db_index=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
    
    def __str__(self):
        return f"Task {self.id} - {self.operation_name} ({self.device.serial_number})"
    
    def calculate_efficiency(self):
        """Calculate efficiency percentage: (standard / actual) * 100"""
        if self.actual_time_seconds and self.actual_time_seconds > 0:
            return round((self.standard_time_seconds / self.actual_time_seconds) * 100, 2)
        return None
    

class Report(models.Model):
    """
    Reports submitted by Technicians and Quality Inspectors after operations.
    Critical for documentation and supervisor/planning review.
    """
    ROLE_TYPE_CHOICES = [
        ('technician', 'Technician Report'),
        ('quality', 'Quality Inspector Report'),
    ]
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_reports'
    )
    role_type = models.CharField(
        max_length=50,
        choices=ROLE_TYPE_CHOICES,
        db_index=True
    )
    content = models.TextField(
        help_text="Detailed notes, findings, and observations from the operation"
    )
    quantity = models.PositiveIntegerField(default=1)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    actual_time_seconds = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
    
    def __str__(self):
        return f"{self.get_role_type_display()} - Task {self.task.id} by {self.created_by.username}"
    
    def clean(self):
        """Validate that role_type matches the creator's role"""
        from django.core.exceptions import ValidationError
        if self.created_by:
            if self.role_type == 'technician' and self.created_by.role != 'technician':
                raise ValidationError("Only technicians can create technician reports")
            if self.role_type == 'quality' and self.created_by.role != 'quality':
                raise ValidationError("Only quality inspectors can create quality reports")

class Task_Device_Assignment(models.Model):
    """
    Intermediate model to assign devices to tasks.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='device_assignments'
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='task_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_device_assignments'
        unique_together = ['task', 'device']
        verbose_name = 'Task Device Assignment'
        verbose_name_plural = 'Task Device Assignments'
    
    def __str__(self):
        return f"Device {self.device.serial_number} assigned to Task {self.task.id}"

class Inspection(models.Model):
    """
    Quality Inspector reviews of completed tasks.
    """
    DECISION_CHOICES = [
        ('pending', 'Pending'),  # Added for auto-created inspections awaiting QI review
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='inspections'
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='inspections'
    )
    inspector = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,  # Allow null/blank for auto-created inspections
        related_name='inspections'
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='pending')  # Default to pending
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'inspections'
        ordering = ['-created_at']
        verbose_name = 'Inspection'
        verbose_name_plural = 'Inspections'
    
    def __str__(self):
        return f"Inspection {self.id} - {self.decision} (Task {self.task.id})"


class SupervisorReview(models.Model):
    """
    Supervisor final approval/rejection of inspections.
    """
    DECISION_CHOICES = [
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name='supervisor_reviews'
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='supervisor_reviews'
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'supervisor_reviews'
        ordering = ['-created_at']
        verbose_name = 'Supervisor Review'
        verbose_name_plural = 'Supervisor Reviews'
    
    def __str__(self):
        return f"Review {self.id} - {self.decision} (Inspection {self.inspection.id})"


class TesterReview(models.Model):
    """
    Final tester approval of completed tasks.
    This is the last stage in the task workflow.
    """
    DECISION_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='tester_reviews'
    )
    tester = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tester_reviews'
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='pending')
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tester_reviews'
        ordering = ['-created_at']
        verbose_name = 'Tester Review'
        verbose_name_plural = 'Tester Reviews'
    
    def __str__(self):
        return f"Tester Review {self.id} - {self.decision} (Task {self.task.id})"


class PerformanceMetric(models.Model):
    """
    Computed performance metrics per technician per day/job order.
    """
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='metrics'
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    date = models.DateField()
    productivity = models.FloatField(null=True, blank=True)
    efficiency = models.FloatField(null=True, blank=True)
    utilization = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_metrics'
        unique_together = ['job_order', 'technician', 'date']
        ordering = ['-date']
        verbose_name = 'Performance Metric'
        verbose_name_plural = 'Performance Metrics'
    
    def __str__(self):
        return f"Metrics for {self.technician.username} on {self.date}"


class Notification(models.Model):
    """
    System notifications for users (rejections, alerts, etc.)
    """
    TYPE_CHOICES = [
        ('task_rejected', 'Task Rejected'),
        ('task_accepted', 'Task Accepted'),
        ('approaching_deadline', 'Approaching Deadline'),
        ('quality_issue', 'Quality Issue Alert'),
        ('efficiency_alert', 'Efficiency Alert'),
        ('report_submitted', 'Report Submitted'),
        ('task_ready_for_inspection', 'Task Ready for Inspection'),
        ('task_ready_for_testing', 'Task Ready for Testing'),
        ('task_completed', 'Task Completed'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=100, choices=TYPE_CHOICES)
    message = models.TextField(blank=True)
    payload = models.JSONField(default=dict)
    read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.get_type_display()} for {self.user.username}"