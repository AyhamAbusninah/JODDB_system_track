import datetime
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.db.models import Sum, Count, Q, F
from django.utils import timezone

# Assuming models are in 'core.models' as per previous tasks
from core.models import Task, Device, JobOrder, User

# --- Constants ---

# Default total available time: 8 hours * 60 min * 60 sec
TOTAL_AVAILABLE_TIME_SECONDS = getattr(settings, 'TOTAL_AVAILABLE_TIME_SECONDS', 28800)
# Default efficiency threshold for alerts
EFFICIENCY_THRESHOLD = getattr(settings, 'EFFICIENCY_THRESHOLD', 70.0)
# Default due date alert window (in days)
DUE_DATE_DAYS_THRESHOLD = getattr(settings, 'DUE_DATE_DAYS_THRESHOLD', 3)
# Default progress threshold for due date alerts
PROGRESS_PERCENT_THRESHOLD = getattr(settings, 'PROGRESS_PERCENT_THRESHOLD', 80.0)


def calculate_technician_metrics(technician_id: int, target_date: datetime.date) -> dict:
    """
    Computes daily productivity, average efficiency, and utilization
    for a specific technician on a given date.
    
    - Productivity: (Total Standard Time) / (Total Available Time) * 100
    - Efficiency: Avg. of (Standard Time / Actual Time) * 100 for completed tasks
    - Utilization: (Total Actual Time) / (Total Available Time) * 100
    """
    
    # Base query for all completed tasks by this tech on this day
    completed_tasks = Task.objects.filter(
        technician_id=technician_id,
        status='done',
        end_time__date=target_date
    )

    if not completed_tasks.exists():
        return {
            "productivity": 0.0,
            "average_efficiency": 0.0,
            "utilization": 0.0,
            "tasks_completed": 0,
            "date": target_date.isoformat(),
        }

    # 1. Aggregate total standard and actual time (in seconds)
    aggregates = completed_tasks.aggregate(
        total_standard_time=Sum('standard_time_seconds'),
        total_actual_time=Sum('actual_time_seconds')
    )

    total_standard_seconds = aggregates['total_standard_time'] or 0
    total_actual_seconds = aggregates['total_actual_time'] or 0

    # 2. Calculate metrics
    # Productivity = (Time Earned) / (Time Available)
    productivity = (total_standard_seconds / TOTAL_AVAILABLE_TIME_SECONDS) * 100.0 if TOTAL_AVAILABLE_TIME_SECONDS > 0 else 0.0

    # Utilization = (Time Worked) / (Time Available)
    utilization = (total_actual_seconds / TOTAL_AVAILABLE_TIME_SECONDS) * 100.0 if TOTAL_AVAILABLE_TIME_SECONDS > 0 else 0.0

    # 3. Calculate Average Efficiency in Python to avoid DB-specific division issues
    # Efficiency = (Time Earned) / (Time Worked)
    efficiencies = []
    for task in completed_tasks.only('standard_time_seconds', 'actual_time_seconds'):
        std_sec = task.standard_time_seconds or 0
        act_sec = task.actual_time_seconds or 0
        
        if act_sec > 0:
            efficiencies.append((std_sec / act_sec) * 100.0)

    average_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0.0

    return {
        "productivity": round(productivity, 2),
        "average_efficiency": round(average_efficiency, 2),
        "utilization": round(utilization, 2),
        "tasks_completed": len(efficiencies),
        "date": target_date.isoformat(),
    }


def calculate_job_order_progress(job_order_id: int) -> dict:
    """
    Computes the completion progress and rejection stats for a Job Order
    based on the status of its associated Devices.
    """
    
    # Get all device statuses for the job order
    device_statuses = Device.objects.filter(job_order_id=job_order_id)
    
    total_devices = device_statuses.count()

    if total_devices == 0:
        return {
            "progress_percent": 0.0,
            "total_completed": 0,
            "total_rejected": 0,
            "total_devices": 0,
        }

    # Aggregate counts based on status
    status_counts = device_statuses.aggregate(
        total_completed=Count('id', filter=Q(current_status='completed')),
        total_rejected=Count('id', filter=Q(current_status='rejected'))
    )

    total_completed = status_counts.get('total_completed', 0)
    total_rejected = status_counts.get('total_rejected', 0)

    # Calculate progress
    progress_percent = (total_completed / total_devices) * 100.0

    return {
        "progress_percent": round(progress_percent, 2),
        "total_completed": total_completed,
        "total_rejected": total_rejected,
        "total_devices": total_devices,
    }


def check_alerts(job_order_id: int, technician_id: int = None) -> list:
    """
    Checks for active alerts on a Job Order or (optionally) for a
    specific technician's work on that Job Order.
    
    Alert Types:
    - low_efficiency: A completed task's efficiency is below threshold.
    - due_date_risk: JO is due soon and progress is below threshold.
    """
    alerts = []

    # --- 1. Efficiency Alert ---
    # Find any completed task with efficiency < threshold
    
    tasks_query = Task.objects.filter(
        job_order_id=job_order_id,
        status='done',
        actual_time_seconds__gt=0  # Avoid division by zero
    ).select_related('technician')

    if technician_id:
        tasks_query = tasks_query.filter(technician_id=technician_id)

    # We must loop in Python as (Duration / Duration) * float
    # is not reliably supported in all DB backends (e.g., SQLite)
    for task in tasks_query:
        std_sec = task.standard_time_seconds or 0
        act_sec = task.actual_time_seconds or 0
        
        if act_sec > 0:
            efficiency = (std_sec / act_sec) * 100.0
            if efficiency < EFFICIENCY_THRESHOLD:
                alerts.append({
                    "type": "low_efficiency",
                    "message": f"Task {task.id} (Technician: {task.technician.username}) has low efficiency: {efficiency:.1f}%.",
                    "task_id": task.id,
                    "technician_id": task.technician_id
                })
                # Found one, that's enough for an "alert"
                break

    # --- 2. Due Date Alert (Only applies to whole Job Order) ---
    if not technician_id:
        try:
            job_order = JobOrder.objects.get(id=job_order_id)
            today = timezone.now().date()
            
            # Check if JO is due soon, not already completed, and has a due date
            if (job_order.due_date and
                job_order.status != 'done' and
                job_order.due_date <= (today + datetime.timedelta(days=DUE_DATE_DAYS_THRESHOLD))):
                
                # If due soon, check progress
                progress_data = calculate_job_order_progress(job_order_id)
                
                if progress_data['progress_percent'] < PROGRESS_PERCENT_THRESHOLD:
                    alerts.append({
                        "type": "due_date_risk",
                        "message": f"Job Order {job_order.id} is due on {job_order.due_date} but is only {progress_data['progress_percent']:.1f}% complete.",
                        "job_order_id": job_order.id,
                        "due_date": job_order.due_date.isoformat(),
                        "progress": progress_data['progress_percent']
                    })
        
        except JobOrder.DoesNotExist:
            # Job order not found, can't check due date
            pass 

    return alerts