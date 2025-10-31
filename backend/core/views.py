from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
# API endpoint to get the inspection for a given task (for supervisor review)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_inspection_for_task(request, task_id):
    """
    Returns the inspection for a given task, prioritizing decision 'accepted'.
    Only supervisors, testers, and admins can access this endpoint.
    """
    from core.models import Inspection
    
    # Check if user is authorized (supervisor, tester, or admin)
    if request.user.role not in ['supervisor', 'tester', 'admin', 'quality']:
        return Response({'detail': 'Not authorized to access this endpoint.'}, status=403)
    
    inspections = Inspection.objects.filter(task_id=task_id).order_by('-created_at')
    accepted = inspections.filter(decision='accepted').first()
    inspection = accepted if accepted else inspections.first()
    if inspection:
        data = {
            'id': inspection.id,
            'task': inspection.task_id,
            'decision': inspection.decision,
            'comments': inspection.comments,
            'created_at': inspection.created_at,
        }
        return Response(data)
    return Response({'detail': 'No inspection found for this task.'}, status=404)
# core/views.py

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import models # Import models for Q object
from django.db.models import Q, Count, Sum
from core.serializers import JobOrderCreateSerializer, JobOrderSerializer, TaskSerializer , UserRegistrationSerializer , PrivilegedUserCreateSerializer , InspectionSerializer, SupervisorReviewSerializer, TesterReviewSerializer, JobSerializer, JobCreateSerializer, ProcessSerializer
from core.permissions import (
    IsRoleRequired, 
    IsPlanningEngineer, 
    IsSupervisor,
    IsTechnicianOrAll,
    IsQualityOrTesterOrAdmin,
    IsPlanningOrAdminOrSupervisorOrQuality,
    IsPlanningOrAdmin,
    IsSupervisorOrAdmin,
    IsSupervisorOrPlanningOrAdmin,
    IsTesterOrAdmin,
    IsTesterOrSupervisorOrAdmin,
    IsQualityOrTesterOrSupervisorOrAdmin,
)
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from core.models import User, JobOrder, Device, Task , Inspection, SupervisorReview, TesterReview, Job, Process
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
#### Import for notifications
from core.notifications.utils import create_notification
from django.db import transaction

# Import our new calculation functions
from core.metrics import calculations
from core.metrics.serializers import TechnicianMetricsSerializer, JobOrderProgressSerializer

import datetime
import pandas as pd
import csv
from django.http import HttpResponse
from io import BytesIO

# -----------------------------------------------------------
# 0. Job and Process ViewSets
# -----------------------------------------------------------

class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job templates.
    - List all available jobs (GET)
    - Retrieve a specific job with all its processes (GET)
    - Create a new job template (POST) - Planning Engineers only
    - Update a job template (PUT/PATCH) - Planning Engineers only
    - Delete a job template (DELETE) - Planning Engineers only
    """
    queryset = Job.objects.all().prefetch_related('processes')
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Use different serializer for create action to handle nested processes.
        """
        if self.action == 'create':
            return JobCreateSerializer
        return JobSerializer
    
    def get_permissions(self):
        """
        Only planning engineers can create, update, or delete jobs.
        All authenticated users can view jobs.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPlanningEngineer()]
        return [IsAuthenticated()]


class ProcessViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Process templates.
    - List all processes (GET)
    - Retrieve a specific process (GET)
    - Create a new process (POST) - Planning Engineers only
    - Update a process (PUT/PATCH) - Planning Engineers only
    - Delete a process (DELETE) - Planning Engineers only
    """
    queryset = Process.objects.all().select_related('job')
    serializer_class = ProcessSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Only planning engineers can create, update, or delete processes.
        All authenticated users can view processes.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPlanningEngineer()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Optionally filter processes by job_id.
        """
        queryset = super().get_queryset()
        job_id = self.request.query_params.get('job_id', None)
        if job_id is not None:
            queryset = queryset.filter(job_id=job_id)
        return queryset


# -----------------------------------------------------------
# 1. Job Order ViewSet (Planning Engineer)
# -----------------------------------------------------------

class JobOrderViewSet(viewsets.ModelViewSet):
    """
    Viewset for JobOrder:
    - PE can CREATE.
    - All authenticated users can LIST and RETRIEVE.
    """
    queryset = JobOrder.objects.all().select_related('created_by', 'job')
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'create':
            return JobOrderCreateSerializer
        return JobOrderSerializer

    def get_permissions(self):
        """Custom permissions based on action."""
        if self.action == 'create':
            # PE only for creation (Role: 'planning' or 'admin')
            self.permission_classes = [IsAuthenticated, IsPlanningOrAdmin]
        else:
            # All authenticated roles for list/retrieve
            self.permission_classes = [IsAuthenticated]
        
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        """Inject the current user into the serializer context."""
        serializer.save(created_by=self.request.user)


# -----------------------------------------------------------
# 2. Technician Task ViewSet (Technician)
# -----------------------------------------------------------

class TechnicianTaskViewSet(
    mixins.ListModelMixin, 
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    """
    Viewset for Technicians to manage their task lifecycle (start/end).
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTechnicianOrAll]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            from core.serializers import TaskSimpleCreateSerializer
            return TaskSimpleCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        """
        Filter tasks to show only what's relevant for each role in the workflow:
        
        TECHNICIAN: 
        - 'available' (can start)
        - 'in_progress' (currently working)
        - 'rejected' (needs to fix and resubmit)
        
        QA INSPECTOR:
        - 'pending_qa' (ready for QA review)
        
        SUPERVISOR:
        - 'qa_approved' (passed QA, awaiting supervisor review)
        
        TESTER:
        - 'pending_tester' (passed supervisor, ready for final testing)
        
        PLANNING/ADMIN: All tasks (for overview)
        """
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        queryset = Task.objects.select_related('device', 'job_order', 'technician')
        
        if user.role == 'technician':
            # Technicians see: available tasks, their own in-progress, and their own rejected
            return queryset.filter(
                Q(status='available', task_type='technician') |
                Q(technician=user, status__in=['in_progress', 'rejected'])
            )
        
        elif user.role == 'quality':
            # QA Inspectors see: pending_qa tasks (ready for inspection)
            # These come from technician tasks that have been completed
            return queryset.filter(status='pending_qa')
        
        elif user.role == 'supervisor':
            # Supervisors see: tester_approved or pending_supervisor tasks (passed tester, awaiting supervisor review)
            return queryset.filter(
                status__in=['tester_approved', 'pending_supervisor']
            )
        
        elif user.role == 'tester':
            # Testers see: pending_tester tasks (ready for final testing)
            # These come from technician tasks that passed supervisor review
            return queryset.filter(status='pending_tester')
        
        elif user.role in ['planning', 'admin']:
            # Planning engineers and admins see all tasks
            return queryset
        
        # Default: no access
        return Task.objects.none()


    @action(detail=True, methods=['patch'])
    def start(self, request, pk=None):
        """
        Action for a Technician to start a task.
        Sets technician, start_time, and status = 'in_progress'.
        """
        task = self.get_object()
        user = request.user

        if task.status != 'available':
            return Response(
                {"detail": f"Task cannot be started. Current status: {task.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update Task
        task.technician = user
        task.start_time = timezone.now()
        task.status = 'in_progress'
        task.save(update_fields=['technician', 'start_time', 'status', 'updated_at'])

        # Update Device status
        task.device.current_status = 'in_progress'
        task.device.save(update_fields=['current_status', 'last_updated'])

        return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)


    @action(detail=True, methods=['patch'])
    def end(self, request, pk=None):
        """
        Action for a Technician to end a task.
        Calculates actual_time_seconds and efficiency, sets end_time and status = 'pending_qa'.
        
        WORKFLOW AFTER TECHNICIAN COMPLETION:
        1. Mark task as 'pending_qa' (awaiting QA Inspector)
        2. Create Inspection record (status='pending')
        3. Send notifications to QI, Supervisor, and Tester
        4. Update device status to 'completed'
        """
        task = self.get_object()
        user = request.user

        if task.status != 'in_progress':
            return Response(
                {"detail": f"Task cannot be ended. Current status: {task.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if task.technician != user:
            return Response(
                {"detail": "You are not the assigned technician for this task."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if not task.start_time:
            return Response(
                {"detail": "Task start time is missing. Cannot calculate duration."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use atomic transaction to ensure all-or-nothing operation
        with transaction.atomic():
            # 1. Update End Time
            task.end_time = timezone.now()
            
            # 2. Calculate Actual Time
            time_difference: datetime.timedelta = task.end_time - task.start_time
            task.actual_time_seconds = int(time_difference.total_seconds())
            
            # 3. Set status to 'pending_qa' (waiting for QA Inspector approval)
            task.status = 'pending_qa'
            
            # 4. Save task updates
            task.save(update_fields=['end_time', 'actual_time_seconds', 'status', 'updated_at'])

            # 5. Update Device status (completed/ready for inspection)
            task.device.current_status = 'completed'
            task.device.save(update_fields=['current_status', 'last_updated'])

            # 6. Create Inspection record with 'pending' status
            inspection = Inspection.objects.create(
                task=task,
                device=task.device,
                inspector=None,  # Will be set when QI/Tester reviews
                decision='pending',
                comments='Awaiting quality inspection'
            )

            # 7. Send notifications to relevant users
            # Find QI users (quality role)
            qi_users = User.objects.filter(role='quality', is_active=True)
            for qi_user in qi_users:
                create_notification(
                    user_id=qi_user.id,
                    type='task_ready_for_inspection',
                    message=f"Task #{task.id} on device {task.device.serial_number} is ready for quality inspection.",
                    payload={
                        'task_id': task.id,
                        'job_order_code': task.job_order.order_code,
                        'device_serial': task.device.serial_number,
                        'inspection_id': inspection.id
                    }
                )
            
            # Find Testing Technicians (tester role)
            tester_users = User.objects.filter(role='tester', is_active=True)
            for tester in tester_users:
                create_notification(
                    user_id=tester.id,
                    type='task_ready_for_testing',
                    message=f"Task #{task.id} on device {task.device.serial_number} is ready for testing verification.",
                    payload={
                        'task_id': task.id,
                        'job_order_code': task.job_order.order_code,
                        'device_serial': task.device.serial_number,
                        'inspection_id': inspection.id
                    }
                )
            
            # Notify Supervisor
            supervisors = User.objects.filter(role='supervisor', is_active=True)
            for supervisor in supervisors:
                create_notification(
                    user_id=supervisor.id,
                    type='task_completed',
                    message=f"Task #{task.id} completed by {task.technician.full_name}. Device: {task.device.serial_number}",
                    payload={
                        'task_id': task.id,
                        'job_order_code': task.job_order.order_code,
                        'technician_id': task.technician.id,
                        'inspection_id': inspection.id
                    }
                )

        # Return updated task data (serializer will calculate and show efficiency)
        return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)
    
    
class TaskStatusSummaryView(APIView):
    """
    Provides a summary of task counts for each status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Returns a dictionary with counts of tasks for each status.
        """
        status_counts = Task.objects.values('status').annotate(count=Count('status'))
        
        # Convert to a more friendly dictionary format
        summary = {item['status']: item['count'] for item in status_counts}

        # Ensure all statuses are present in the summary, even if count is 0
        all_statuses = [s[0] for s in Task.STATUS_CHOICES]
        for status_key in all_statuses:
            if status_key not in summary:
                summary[status_key] = 0
        
        return Response(summary)


# 3. Authentication Serializers
# -----------------------------------------------------------

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for new user registration. 
    Handles validation and password hashing.
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        # Include fields for the custom User model
        fields = ('username', 'password', 'password2', 'email', 'full_name', 'role')
        # Ensure role is set, but only the PE/Admin should set non-default roles
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            # Prevent users from setting a privileged role during self-registration
            'role': {'default': 'technician', 'read_only': True} 
        }

    def validate(self, attrs):
        """Check that the two password fields match."""
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        """
        Create and return a new user instance, setting the hashed password.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            role=validated_data.get('role', 'technician') # Use 'technician' if not explicitly provided/allowed
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class UserRegistrationView(CreateAPIView):
    """
    Endpoint for new user registration.
    Allows anyone (AllowAny) to create a new user account.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Allows Admin/PE to create/manage users with specific roles.
    """
    queryset = User.objects.all().order_by('username')
    # A simple serializer for retrieval
    class UserReadSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'date_joined']
            read_only_fields = fields

    def get_serializer_class(self):
        if self.action == 'create':
            return PrivilegedUserCreateSerializer
        return self.UserReadSerializer # For list/retrieve

    def get_permissions(self):
        """Only Admin and Planning Engineer can manage users."""
        if self.action in ['list', 'retrieve']:
            # Allow supervisors and quality inspectors to list/view users for metrics and reporting
            self.permission_classes = [IsAuthenticated, IsPlanningOrAdminOrSupervisorOrQuality]
        else:
            # Only admin and planning can create/update/delete users
            self.permission_classes = [IsAuthenticated, IsPlanningOrAdmin]
        return [permission() for permission in self.permission_classes]
    
# -----------------------------------------------------------
# 4. Quality Inspection ViewSet (QI Use)
# -----------------------------------------------------------

class InspectionViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Viewset for Quality Inspector and Tester to perform inspections.
    - Quality Inspectors can create and view all inspections
    - Testers can create and view their own inspections
    - Supervisors can view all inspections
    """
    serializer_class = InspectionSerializer

    def get_queryset(self):
        """
        Filter inspections based on user role and workflow stage:
        - Quality Inspectors: see inspections of tasks with status='pending_qa'
        - Supervisors: see all inspections for review purposes
        - Admin: see all inspections
        """
        user = self.request.user
        
        if user.role == 'quality':
            # QA Inspectors see only inspections for tasks awaiting QA (pending_qa status)
            return Inspection.objects.filter(
                task__status='pending_qa'
            ).select_related('task', 'task__device', 'inspector')
        elif user.role in ['supervisor', 'admin']:
            # Supervisor and Admin see all inspections for overview
            return Inspection.objects.all().select_related('task', 'task__device', 'inspector')
        elif user.role == 'tester':
            # Testers see inspections for their tasks that are pending testing
            return Inspection.objects.filter(
                task__status='pending_tester'
            ).select_related('task', 'task__device', 'inspector')
        
        return Inspection.objects.none()

    def get_permissions(self):
        """
        Permissions based on action and user role:
        - Create: Quality Inspector or Tester
        - List: Quality Inspector, Tester, Supervisor, or Admin
        """
        if self.action == 'create':
            self.permission_classes = [IsAuthenticated, IsQualityOrTesterOrAdmin]
        else:
            # List action - Quality needs to be included!
            self.permission_classes = [IsAuthenticated, IsQualityOrTesterOrSupervisorOrAdmin]
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        """
        Updates the existing pending inspection for the task instead of creating a new one.
        """
        decision = serializer.validated_data['decision']
        task = serializer.validated_data.pop('task_id')
        comments = serializer.validated_data.get('comments', '')

        with transaction.atomic():
            # Find the pending inspection for this task
            inspection = Inspection.objects.filter(task=task, decision='pending').order_by('-created_at').first()
            if inspection:
                inspection.inspector = self.request.user
                inspection.decision = decision
                inspection.comments = comments
                inspection.save(update_fields=['inspector', 'decision', 'comments', 'created_at'])
            else:
                # Fallback: create a new inspection if none exists
                inspection = serializer.save(inspector=self.request.user, device=task.device, task=task)

            # Update Task status based on QA decision
            if decision == 'accepted':
                task.status = 'pending_tester'
                task.save(update_fields=['status', 'updated_at'])
                testers = User.objects.filter(role='tester', is_active=True)
                for tester in testers:
                    create_notification(
                        user_id=tester.id,
                        type='task_ready_for_testing',
                        message=f"Task #{task.id} passed QA inspection and is ready for final testing.",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code,
                            'device_serial': task.device.serial_number
                        }
                    )
            elif decision == 'rejected':
                task.status = 'rejected'
                task.device.current_status = 'rejected'
                task.save(update_fields=['status', 'updated_at'])
                task.device.save(update_fields=['current_status', 'last_updated'])
                if task.technician:
                    message = f"Task #{task.id} was rejected by QA Inspector: {inspection.comments[:50]}..."
                    create_notification(
                        user_id=task.technician.id,
                        type='task_rejected',
                        message=message,
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code,
                            'inspection_id': inspection.id
                        }
                    )


# -----------------------------------------------------------
# 5. Supervisor Review ViewSet (Supervisor Use)
# -----------------------------------------------------------

class SupervisorReviewViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Viewset for Supervisor to perform the final review of an inspection.
    """
    serializer_class = SupervisorReviewSerializer
    
    def get_queryset(self):
        """
        Filter supervisor reviews based on user role:
        - Supervisors: see reviews of tasks awaiting supervisor review (pending_supervisor status)
        - Planning/Admin: see all reviews
        """
        user = self.request.user
        
        if user.role == 'supervisor':
            # Supervisors see reviews for tasks that are pending_supervisor (awaiting their review)
            return SupervisorReview.objects.filter(
                inspection__task__status='pending_supervisor'
            ).select_related('inspection', 'supervisor', 'inspection__task')
        elif user.role in ['planning', 'admin']:
            # Planning engineers and admins see all reviews
            return SupervisorReview.objects.all().select_related('inspection', 'supervisor', 'inspection__task')
        
        return SupervisorReview.objects.none()
    
    def get_permissions(self):
        """Supervisor only for create, Supervisor/PE for list."""
        if self.action == 'create':
            self.permission_classes = [IsAuthenticated, IsSupervisorOrAdmin]
        else:
            self.permission_classes = [IsAuthenticated, IsSupervisorOrPlanningOrAdmin]
        return [permission() for permission in self.permission_classes]
    
    def perform_create(self, serializer):
        """
        Saves the supervisor review and updates the Task status.
        
        Workflow:
        - If accepted: task.status = 'supervisor_approved' (task complete)
        - If rejected: task.status = 'rejected' (task failed supervisor review)
        """
        decision = serializer.validated_data['decision']
        inspection = serializer.validated_data['inspection']
        task = inspection.task  # Get the related Task
        
        with transaction.atomic():
            # 1. Save the Review record
            supervisor_review = serializer.save(supervisor=self.request.user)
            
            # 2. Update Task status based on supervisor decision
            if decision == 'accepted':
                # Supervisor approved: task is complete
                task.status = 'supervisor_approved'
                task.device.current_status = 'completed'
                task.save(update_fields=['status', 'updated_at'])
                task.device.save(update_fields=['current_status', 'last_updated'])
                
                # Notify relevant stakeholders
                if task.technician:
                    create_notification(
                        user_id=task.technician.id,
                        type='task_completed',
                        message=f"Task #{task.id} completed successfully after supervisor review.",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code
                        }
                    )
                
                # Notify testers
                testers = User.objects.filter(role='tester', is_active=True)
                for tester in testers:
                    create_notification(
                        user_id=tester.id,
                        type='task_completed',
                        message=f"Task #{task.id} completed after supervisor review.",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code,
                            'device_serial': task.device.serial_number
                        }
                    )
            
            elif decision == 'rejected':
                # Supervisor rejected: task fails supervisor review
                task.status = 'rejected'
                task.device.current_status = 'rejected'
                task.save(update_fields=['status', 'updated_at'])
                task.device.save(update_fields=['current_status', 'last_updated'])
                
                # Notify technician of rejection
                if task.technician:
                    create_notification(
                        user_id=task.technician.id,
                        type='task_rejected',
                        message=f"Task #{task.id} was rejected during supervisor review: {supervisor_review.comments[:50]}...",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code
                        }
                    )
            
            return supervisor_review
        

class TesterReviewViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Viewset for Tester to perform final testing and approval of tasks.
    This is the final stage before task completion.
    """
    serializer_class = TesterReviewSerializer
    queryset = TesterReview.objects.all().select_related('task', 'tester')
    
    def get_permissions(self):
        """Tester only for create, Tester/Supervisor for list."""
        if self.action == 'create':
            self.permission_classes = [IsAuthenticated, IsTesterOrAdmin]
        else:
            self.permission_classes = [IsAuthenticated, IsTesterOrSupervisorOrAdmin]
        return [permission() for permission in self.permission_classes]
    
    def get_queryset(self):
        """
        Filter tester reviews based on user role and workflow stage:
        - Testers: see reviews for tasks awaiting tester testing (pending_tester status)
        - Supervisors/Admin: see all reviews
        """
        user = self.request.user
        
        if user.role == 'tester':
            # Testers see reviews for tasks that are pending_tester (awaiting their testing)
            return TesterReview.objects.filter(
                task__status='pending_tester'
            ).select_related('task', 'tester')
        elif user.role in ['supervisor', 'admin']:
            # Supervisors and admins see all reviews
            return TesterReview.objects.all().select_related('task', 'tester')
        
        return TesterReview.objects.none()
    
    def perform_create(self, serializer):
        """
        Saves the tester review and updates the Task status.
        
        Workflow:
        - If accepted: task.status = 'pending_supervisor' (move to Supervisor for final review)
        - If rejected: task.status = 'rejected' (task failed final testing)
        """
        decision = serializer.validated_data['decision']
        task = serializer.validated_data.pop('task_id')
        
        with transaction.atomic():
            # 1. Save the Tester Review record
            tester_review = serializer.save(tester=self.request.user, task=task)
            
            # 2. Update Task status based on tester decision
            if decision == 'accepted':
                # Tester approved: move to supervisor for final review
                task.status = 'pending_supervisor'
                task.save(update_fields=['status', 'updated_at'])
                
                # Notify supervisors that this task passed testing and is ready for final review
                supervisors = User.objects.filter(role='supervisor', is_active=True)
                for supervisor in supervisors:
                    create_notification(
                        user_id=supervisor.id,
                        type='task_ready_for_supervisor_review',
                        message=f"Task #{task.id} passed tester inspection and is ready for your final review.",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code,
                            'device_serial': task.device.serial_number
                        }
                    )
            
            elif decision == 'rejected':
                # Tester rejected: task fails final testing
                task.status = 'rejected'
                task.device.current_status = 'rejected'
                task.save(update_fields=['status', 'updated_at'])
                task.device.save(update_fields=['current_status', 'last_updated'])
                
                # Notify technician of rejection
                if task.technician:
                    create_notification(
                        user_id=task.technician.id,
                        type='task_rejected',
                        message=f"Task #{task.id} was rejected during tester inspection: {tester_review.comments[:50]}...",
                        payload={
                            'task_id': task.id,
                            'job_order_code': task.job_order.order_code
                        }
                    )
            
            return tester_review

class TechnicianMetricsView(APIView):
    """
    Provides daily performance metrics (Productivity, Efficiency, Utilization)
    for a specific Technician.
    
    Access: Planning Engineer, Supervisor
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TechnicianMetricsSerializer

    def get_permissions(self):
        """Custom permissions - only planning engineers and supervisors can access"""
        self.permission_classes = [IsAuthenticated, IsSupervisorOrPlanningOrAdmin]
        return [permission() for permission in self.permission_classes]

    def get(self, request, id, format=None):
        """
        GET /api/v1/metrics/technician/{id}/?date=YYYY-MM-DD
        
        If 'date' param is not provided, it defaults to the current date.
        """
        
        # 1. Validate Technician ID
        try:
            # Check that user exists and is a technician
            user = User.objects.get(id=id)
            if user.role != 'technician':
                return Response(
                    {"error": "Specified user is not a technician."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (User.DoesNotExist, ValueError):
            return Response(
                {"error": "Technician not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Validate Date Parameter
        date_str = request.query_params.get('date')
        if not date_str:
            target_date = timezone.now().date()
        else:
            try:
                target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 3. Calculate and Return Metrics
        metrics = calculations.calculate_technician_metrics(
            technician_id=id, 
            target_date=target_date
        )
        
        # 4. Serialize and return
        serializer = self.serializer_class(data=metrics)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobOrderMetricsView(APIView):
    """
    Provides progress percentage, completion stats, and active alerts
    for a specific Job Order.
    
    Access: Planning Engineer, Supervisor
    """
    permission_classes = [IsAuthenticated]
    serializer_class = JobOrderProgressSerializer

    def get_permissions(self):
        """Custom permissions - only planning engineers and supervisors can access"""
        self.permission_classes = [IsAuthenticated, IsSupervisorOrPlanningOrAdmin]
        return [permission() for permission in self.permission_classes]

    def get(self, request, id, format=None):
        """
        GET /api/v1/metrics/job-order/{id}/
        
        Returns:
        - progress_percent: Overall completion percentage
        - total_completed: Count of completed devices
        - total_rejected: Count of rejected devices
        - total_devices: Total devices in job order
        - alerts: List of active alerts (efficiency/deadline)
        """
        
        # 1. Validate Job Order ID
        try:
            # Check that job order exists and is active
            job_order = JobOrder.objects.get(id=id)
            if job_order.status == 'archived':
                return Response(
                    {"error": "Cannot retrieve metrics for archived job orders."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (JobOrder.DoesNotExist, ValueError):
            return Response(
                {"error": "Job Order not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Calculate Progress
        progress_data = calculations.calculate_job_order_progress(job_order_id=id)

        # 3. Check for Alerts
        alerts = calculations.check_alerts(job_order_id=id)
        
        # 4. Prepare Response Data
        response_data = {
            **progress_data,  # Unpacks the progress dict
            "alerts": alerts
        }
        
        # 5. Serialize and Return
        serializer = self.serializer_class(data=response_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
# -----------------------------------------------------------
# 5.5 Planner Statistics View (Planning Engineer)
# -----------------------------------------------------------

class PlannerStatisticsView(APIView):
    """
    Provides real-time statistics for the Planner Dashboard.
    
    Endpoint: GET /api/v1/planner/statistics/
    Role Access: Planning Engineer, Admin
    
    Returns:
    - active_job_orders: Count of job orders in progress
    - due_this_week: Count of job orders due within 7 days
    - avg_productivity: Average productivity percentage for today
    - active_technicians: Count of technicians who worked today
    - total_technicians: Total count of all technicians
    - technician_utilization: Percentage of technicians currently working
    - overdue_tasks: Count of tasks past their due date
    - pending_reviews: Count of tasks awaiting supervisor review
    """
    permission_classes = [IsAuthenticated, IsPlanningOrAdmin]

    def get(self, request, format=None):
        """
        GET /api/v1/planner/statistics/
        
        Returns comprehensive dashboard statistics for planning engineers.
        """
        today = timezone.now().date()
        week_from_now = today + datetime.timedelta(days=7)
        
        # 1. Active Job Orders (status in progress or available for work)
        active_job_orders = JobOrder.objects.filter(status__in=['available', 'in_progress']).count()
        
        # 2. Job Orders due this week
        due_this_week = JobOrder.objects.filter(
            due_date__gte=today,
            due_date__lte=week_from_now,
            status__in=['available', 'in_progress']
        ).count()
        
        # 3. Average Productivity (today's tasks)
        today_tasks = Task.objects.filter(
            end_time__date=today,
            actual_time_seconds__isnull=False,
            standard_time_seconds__gt=0
        )
        
        if today_tasks.exists():
            total_standard = sum(t.standard_time_seconds for t in today_tasks)
            total_actual = sum(t.actual_time_seconds for t in today_tasks)
            avg_productivity = (total_standard / total_actual * 100) if total_actual > 0 else 0
        else:
            avg_productivity = 0
        
        # 4. Active Technicians (worked today)
        active_technicians = Task.objects.filter(
            start_time__date=today,
            technician__isnull=False
        ).values('technician').distinct().count()
        
        # 5. Total Technicians (all technician + quality roles)
        total_technicians = User.objects.filter(
            role__in=['technician', 'quality', 'tester'],
            is_active=True
        ).count()
        
        # 6. Technician Utilization
        technician_utilization = (active_technicians / total_technicians * 100) if total_technicians > 0 else 0
        
        # 7. Overdue Tasks (tasks on job orders past due date)
        overdue_tasks = Task.objects.filter(
            status__in=['available', 'in_progress'],
            job_order__due_date__lt=today
        ).count()
        
        # 8. Pending Reviews (tasks awaiting approval)
        pending_reviews = Task.objects.filter(status='pending-approval').count()
        
        # Prepare response
        statistics = {
            'active_job_orders': active_job_orders,
            'due_this_week': due_this_week,
            'avg_productivity': round(avg_productivity, 2),
            'active_technicians': active_technicians,
            'total_technicians': total_technicians,
            'technician_utilization': round(technician_utilization, 2),
            'overdue_tasks': overdue_tasks,
            'pending_reviews': pending_reviews,
        }
        
        return Response(statistics, status=status.HTTP_200_OK)

# -----------------------------------------------------------
# 6. Excel Import View (Planning Engineer)
# -----------------------------------------------------------

class ExcelImportView(APIView):
    """
    Excel/CSV Import View for Planning Engineer to bulk create Job Orders.
    
    Endpoint: POST /api/v1/data/import/job-order/
    Role Access: Planning Engineer only
    """
    permission_classes = [IsAuthenticated, IsPlanningOrAdmin]
    
    def post(self, request, format=None):
        """
        Handles file upload, processes Excel/CSV data, and creates Job Orders.
        
        Expected file format:
        - Columns: job_order_code, title, due_date, device_serial, standard_time_seconds
        - Multiple rows with same job_order_code will be grouped into one JO
        """
        # 1. Validate file upload
        if 'file' not in request.FILES:
            return Response(
                {"error": "No file provided. Please upload a CSV or Excel file."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        file_extension = uploaded_file.name.split('.')[-1].lower()
        
        if file_extension not in ['csv', 'xlsx', 'xls']:
            return Response(
                {"error": "Invalid file format. Please upload CSV or Excel file."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 2. Read file into DataFrame
            if file_extension == 'csv':
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)
            
            # 3. Validate required columns
            required_columns = ['job_order_code', 'title', 'due_date', 'device_serial', 'standard_time_seconds']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response(
                    {"error": f"Missing required columns: {', '.join(missing_columns)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 4. Process data and group by job_order_code
            job_orders_data = {}
            duplicates = []
            errors = []
            
            for index, row in df.iterrows():
                jo_code = str(row['job_order_code']).strip()
                device_serial = str(row['device_serial']).strip()
                
                # Check for duplicate device serials in DB
                if Device.objects.filter(serial_number=device_serial).exists():
                    duplicates.append(device_serial)
                    continue
                
                # Group by job order code
                if jo_code not in job_orders_data:
                    job_orders_data[jo_code] = {
                        'order_code': jo_code,
                        'title': str(row['title']).strip(),
                        'due_date': pd.to_datetime(row['due_date']).date(),
                        'standard_time_seconds': int(row['standard_time_seconds']),
                        'device_serials': []
                    }
                
                job_orders_data[jo_code]['device_serials'].append(device_serial)
            
            # 5. Create Job Orders using JobOrderCreateSerializer
            created_jos = []
            total_devices = 0
            
            with transaction.atomic():
                for jo_code, jo_data in job_orders_data.items():
                    # Check if JO already exists
                    if JobOrder.objects.filter(order_code=jo_code).exists():
                        errors.append(f"Job Order {jo_code} already exists")
                        continue
                    
                    # Use existing serializer for validation and creation
                    serializer = JobOrderCreateSerializer(
                        data=jo_data,
                        context={'request': request}
                    )
                    
                    if serializer.is_valid():
                        job_order = serializer.save()
                        created_jos.append(jo_code)
                        total_devices += len(jo_data['device_serials'])
                    else:
                        errors.append(f"Job Order {jo_code}: {serializer.errors}")
            
            # 6. Return structured summary
            return Response({
                "success": True,
                "summary": {
                    "total_job_orders_created": len(created_jos),
                    "total_devices_created": total_devices,
                    "created_job_orders": created_jos,
                    "duplicates": duplicates,
                    "errors": errors
                }
            }, status=status.HTTP_201_CREATED if created_jos else status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {"error": f"Error processing file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -----------------------------------------------------------
# 7. Daily Report Export View (Planning Engineer & Supervisor)
# -----------------------------------------------------------

class DailyReportExportView(APIView):
    """
    Daily Report Export View for exporting completed tasks data.
    
    Endpoint: GET /api/v1/data/export/daily-report/?date=YYYY-MM-DD
    Role Access: Planning Engineer, Supervisor
    """
    permission_classes = [IsAuthenticated, (IsPlanningEngineer | IsSupervisor)]
    
    def get(self, request, format=None):
        """
        Exports daily report of completed and accepted tasks.
        
        Query Parameters:
        - date: YYYY-MM-DD format (optional, defaults to today)
        - format: 'csv' or 'excel' (optional, defaults to 'csv')
        """
        # 1. Validate and parse date parameter
        date_str = request.query_params.get('date')
        export_format = request.query_params.get('format', 'csv').lower()
        
        if not date_str:
            target_date = timezone.now().date()
        else:
            try:
                target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 2. Query completed tasks for the requested date
        # Filter tasks that were completed on the target date (using updated_at as completion date)
        # Valid statuses: 'available', 'in_progress', 'pending-approval', 'approved', 'rejected', 'done'
        tasks = Task.objects.filter(
            status__in=['done', 'approved', 'rejected'],
            updated_at__date=target_date
        ).select_related('job_order', 'device', 'technician')
        
        if not tasks.exists():
            return Response(
                {"message": f"No completed tasks found for {target_date}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 3. Aggregate data into flat list
        report_data = []
        for task in tasks:
            efficiency = task.calculate_efficiency()
            
            report_data.append({
                'Job Order Code': task.job_order.order_code if task.job_order else 'N/A',
                'Device Serial': task.device.serial_number if task.device else 'N/A',
                'Technician Name': task.technician.full_name if task.technician else 'Unassigned',
                'Operation Name': task.operation_name,
                'Standard Time (seconds)': task.standard_time_seconds,
                'Actual Time (seconds)': task.actual_time_seconds if task.actual_time_seconds else 'N/A',
                'Efficiency (%)': f"{efficiency:.2f}" if efficiency else 'N/A',
                'Status': task.get_status_display(),
                'Start Time': task.start_time.strftime('%Y-%m-%d %H:%M:%S') if task.start_time else 'N/A',
                'End Time': task.end_time.strftime('%Y-%m-%d %H:%M:%S') if task.end_time else 'N/A',
            })
        
        # 4. Generate and serve the file response
        if export_format == 'excel':
            # Generate Excel file
            df = pd.DataFrame(report_data)
            output = BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Daily Report')
            
            output.seek(0)
            
            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="daily_report_{target_date}.xlsx"'
            
        else:  # CSV format (default)
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="daily_report_{target_date}.csv"'
            
            writer = csv.DictWriter(response, fieldnames=report_data[0].keys())
            writer.writeheader()
            writer.writerows(report_data)
        
        return response


# -----------------------------------------------------------
# 8. PDF Report Export View (Planning Engineer & Supervisor)
# -----------------------------------------------------------

class JobOrderPDFExportView(APIView):
    """
    PDF Report Export View for exporting Job Order detailed reports.
    
    Endpoint: GET /api/v1/reports/joborder/{id}/export/pdf
    Role Access: Planning Engineer, Supervisor
    
    Generates comprehensive PDF report including:
    - Job Order summary (code, title, dates, progress)
    - Device list with status
    - Task details with technician names, times, efficiency
    - Quality inspection results
    - Summary statistics and charts
    """
    permission_classes = [IsAuthenticated, (IsPlanningEngineer | IsSupervisor)]
    
    def get(self, request, id, format=None):
        """
        Generate and download PDF report for a specific Job Order.
        
        Parameters:
        - id: Job Order ID
        
        Returns:
        - PDF file download with comprehensive job order report
        """
        try:
            # Import ReportLab libraries
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
            from io import BytesIO
        except ImportError:
            return Response(
                {"error": "PDF generation library not installed. Please install reportlab: pip install reportlab"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 1. Validate Job Order ID
        try:
            job_order = JobOrder.objects.get(id=id)
        except JobOrder.DoesNotExist:
            return Response(
                {"error": "Job Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 2. Fetch related data
        devices = Device.objects.filter(job_order=job_order)
        tasks = Task.objects.filter(job_order=job_order).select_related('device', 'technician')
        inspections = Inspection.objects.filter(task__job_order=job_order).select_related('task', 'inspector')
        
        # 3. Calculate summary statistics
        total_devices = devices.count()
        completed_devices = devices.filter(current_status='completed').count()
        rejected_devices = devices.filter(current_status='rejected').count()
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='done').count()
        in_progress_tasks = tasks.filter(status='in_progress').count()
        
        total_inspections = inspections.count()
        accepted_inspections = inspections.filter(decision='accepted').count()
        rejected_inspections = inspections.filter(decision='rejected').count()
        
        # Calculate average efficiency
        completed_with_efficiency = tasks.filter(status='done', actual_time_seconds__isnull=False)
        if completed_with_efficiency.exists():
            avg_efficiency = sum([t.calculate_efficiency() or 0 for t in completed_with_efficiency]) / completed_with_efficiency.count()
        else:
            avg_efficiency = 0
        
        # 4. Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=1*inch, bottomMargin=0.75*inch)
        
        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # 5. Build PDF content
        
        # Title
        elements.append(Paragraph("Job Order Report", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Job Order Info
        elements.append(Paragraph("Job Order Information", heading_style))
        
        job_info_data = [
            ['Order Code:', job_order.order_code],
            ['Title:', job_order.title],
            ['Description:', job_order.description or 'N/A'],
            ['Total Devices:', str(total_devices)],
            ['Due Date:', job_order.due_date.strftime('%Y-%m-%d')],
            ['Created By:', job_order.created_by.full_name if job_order.created_by else 'N/A'],
            ['Created At:', job_order.created_at.strftime('%Y-%m-%d %H:%M')],
            ['Status:', job_order.get_status_display()],
        ]
        
        job_info_table = Table(job_info_data, colWidths=[2*inch, 4*inch])
        job_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(job_info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary Statistics
        elements.append(Paragraph("Summary Statistics", heading_style))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Progress', f"{completed_devices}/{total_devices} devices ({int(completed_devices/total_devices*100) if total_devices > 0 else 0}%)"],
            ['Completed Tasks', f"{completed_tasks}/{total_tasks}"],
            ['In Progress Tasks', str(in_progress_tasks)],
            ['Rejected Devices', str(rejected_devices)],
            ['Total Inspections', str(total_inspections)],
            ['Accepted Inspections', str(accepted_inspections)],
            ['Rejected Inspections', str(rejected_inspections)],
            ['Average Efficiency', f"{avg_efficiency:.1f}%"],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Tasks Details
        elements.append(Paragraph("Task Details", heading_style))
        
        task_data = [['Task ID', 'Device', 'Operation', 'Technician', 'Status', 'Efficiency']]
        
        for task in tasks[:50]:  # Limit to 50 tasks to avoid PDF size issues
            technician_name = task.technician.full_name if task.technician else 'Unassigned'
            device_serial = task.device.serial_number if task.device else f"Device #{task.device_id}"
            efficiency = task.calculate_efficiency()
            efficiency_str = f"{efficiency:.1f}%" if efficiency else 'N/A'
            
            task_data.append([
                str(task.id),
                device_serial,
                task.operation_name[:30],  # Truncate long names
                technician_name,
                task.get_status_display(),
                efficiency_str
            ])
        
        if len(tasks) > 50:
            task_data.append(['...', f'({len(tasks) - 50} more tasks)', '', '', '', ''])
        
        task_table = Table(task_data, colWidths=[0.6*inch, 1.2*inch, 1.8*inch, 1.2*inch, 1*inch, 0.8*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ]))
        elements.append(task_table)
        
        # Footer
        elements.append(Spacer(1, 0.5*inch))
        footer_text = f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} | JODDB System - Aselsan Middle East"
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, 
                                       textColor=colors.grey, alignment=TA_CENTER)
        elements.append(Paragraph(footer_text, footer_style))
        
        # 6. Build PDF
        doc.build(elements)
        
        # 7. Prepare response
        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="job_order_{job_order.order_code}_report.pdf"'
        
        return response