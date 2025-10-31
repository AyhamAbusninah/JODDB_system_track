# core/serializers.py

from rest_framework import serializers
from core.notifications.utils import create_notification
from django.db import transaction
from django.core.validators import MinValueValidator
from rest_framework.exceptions import ValidationError
from core.models import JobOrder, Device, Task , Inspection, SupervisorReview, TesterReview, Job, Process
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from core.models import User, JobOrder, Device, Task


# -----------------------------------------------------------
# 0. Job and Process Serializers
# -----------------------------------------------------------

class ProcessSerializer(serializers.ModelSerializer):
    """Serializer for Process templates."""
    class Meta:
        model = Process
        fields = ['id', 'job', 'operation_name', 'standard_time_seconds', 'task_type', 'order']
        read_only_fields = ['id']


class NestedProcessSerializer(serializers.ModelSerializer):
    """Serializer for Process templates when nested in Job creation (job field excluded)."""
    class Meta:
        model = Process
        fields = ['operation_name', 'standard_time_seconds', 'task_type', 'order']


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job templates with their processes."""
    processes = ProcessSerializer(many=True, read_only=True)
    
    class Meta:
        model = Job
        fields = ['id', 'name', 'description', 'processes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'processes']


class JobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Job templates with nested processes."""
    processes = NestedProcessSerializer(many=True, required=False)
    
    class Meta:
        model = Job
        fields = ['id', 'name', 'description', 'processes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """
        Create a new job along with its processes.
        """
        processes_data = validated_data.pop('processes', [])
        job = Job.objects.create(**validated_data)
        
        # Create the processes for this job
        for process_data in processes_data:
            Process.objects.create(job=job, **process_data)
        
        return job
    
    def update(self, instance, validated_data):
        """
        Update a job. Note: Processes are managed separately via ProcessViewSet.
        """
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance


# -----------------------------------------------------------
# 1. Job Order Serializers (PE Use)
# -----------------------------------------------------------

class JobOrderSerializer(serializers.ModelSerializer):
    """
    Standard serializer for JobOrder retrieval (list/detail).
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    job_name = serializers.CharField(source='job.name', read_only=True)

    class Meta:
        model = JobOrder
        fields = ['id', 'job', 'job_name', 'order_code', 'title', 'due_date', 'total_devices', 
                  'status', 'created_at', 'created_by_username']
        read_only_fields = ['id', 'created_at', 'created_by_username', 'job_name']


class JobOrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for Planning Engineer to create a JobOrder.
    This serializer NO LONGER creates tasks.
    """
    # Make description explicitly optional
    description = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Detailed description of the job order (optional)"
    )

    class Meta:
        model = JobOrder
        fields = ['job', 'order_code', 'title', 'description', 'due_date', 'total_devices']

    def create(self, validated_data):
        """
        Create a JobOrder instance.
        """
        # Set the creator from the request context
        validated_data['created_by'] = self.context['request'].user
        
        # The 'total_devices' field is now directly provided by the user
        job_order = JobOrder.objects.create(**validated_data)
        
        return job_order


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating one or more tasks for a given Job Order.
    """
    # Accept a list of device serials to create tasks for
    device_serials = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        min_length=1,
        help_text="List of unique serial numbers for devices to create tasks for."
    )

    class Meta:
        model = Task
        fields = [
            'job_order', 
            'operation_name', 
            'standard_time_seconds', 
            'task_type',
            'device_serials'
        ]

    def validate_device_serials(self, value):
        """Check if all provided device serials exist."""
        existing_devices = Device.objects.filter(serial_number__in=value)
        if existing_devices.count() != len(value):
            found_serials = existing_devices.values_list('serial_number', flat=True)
            missing_serials = set(value) - set(found_serials)
            raise ValidationError(f"The following device serials do not exist: {', '.join(missing_serials)}")
        return value

    def create(self, validated_data):
        """
        Create multiple tasks for the specified devices under a job order.
        """
        job_order = validated_data['job_order']
        device_serials = validated_data.pop('device_serials')
        
        tasks_to_create = []
        devices = Device.objects.filter(serial_number__in=device_serials)

        for device in devices:
            tasks_to_create.append(
                Task(
                    job_order=job_order,
                    device=device,
                    operation_name=validated_data['operation_name'],
                    standard_time_seconds=validated_data['standard_time_seconds'],
                    task_type=validated_data.get('task_type', 'technician'),
                    status='available'
                )
            )
        
        # Bulk create tasks for efficiency
        created_tasks = Task.objects.bulk_create(tasks_to_create)
        
        # Return the list of created tasks
        return created_tasks


class TaskSimpleCreateSerializer(serializers.ModelSerializer):
    """
    Simple serializer for creating individual tasks.
    Used when adding tasks from job processes.
    """
    device_serial = serializers.CharField(max_length=100, write_only=True)
    estimated_time = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'job_order',
            'process',
            'device_serial',
            'operation_name',
            'task_type',
            'estimated_time'
        ]
    
    def create(self, validated_data):
        """Create a task and optionally create the device if it doesn't exist."""
        device_serial = validated_data.pop('device_serial')
        estimated_time = validated_data.pop('estimated_time', None)
        
        # Get or create the device
        device, created = Device.objects.get_or_create(
            serial_number=device_serial,
            defaults={'job_order': validated_data['job_order']}
        )
        
        # Create the task
        task = Task.objects.create(
            device=device,
            standard_time_seconds=estimated_time or 0,
            status='available',
            **validated_data
        )
        
        return task


# -----------------------------------------------------------
# 2. Task Serializer (Technician Use)
# -----------------------------------------------------------

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for general task retrieval and display.
    Includes calculated efficiency and task type.
    """
    job_order_code = serializers.CharField(source='job_order.order_code', read_only=True)
    device_serial = serializers.CharField(source='device.serial_number', read_only=True)
    technician_username = serializers.CharField(source='technician.username', read_only=True)
    efficiency = serializers.SerializerMethodField()
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'job_order_code', 'device_serial', 'technician_username', 
                  'operation_name', 'task_type', 'task_type_display', 'standard_time_seconds', 'start_time', 
                  'end_time', 'actual_time_seconds', 'status', 'efficiency', 'created_at']
        read_only_fields = ['id', 'job_order_code', 'device_serial', 'technician_username', 'efficiency', 'task_type_display', 'created_at']

    def get_efficiency(self, obj):
        """Calls the model method to calculate efficiency."""
        return obj.calculate_efficiency()
    

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
        fields = ('username', 'password', 'password2', 'email', 'full_name', 'role')
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            # 👇 CHANGE: Allow 'role' to be written and validated against choices
            # 'role': {'default': 'technician', 'read_only': True} # REMOVE OR COMMENT OUT THIS LINE
            'role': {'required': True} # You might enforce that a role is chosen
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
    

class PrivilegedUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin/PE to create users with any role.
    This replaces the self-registration serializer.
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        # Allows setting all fields, including role
        fields = ('username', 'password', 'email', 'full_name', 'role')

    def create(self, validated_data):
        """
        Creates a user instance, respects the 'role' field in validated_data.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            role=validated_data['role'] 
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'date_joined']
        read_only_fields = fields


# -----------------------------------------------------------
# 4. Inspection and Review Serializers
# -----------------------------------------------------------

class InspectionSerializer(serializers.ModelSerializer):
    """
    Serializer for Quality Inspector to perform an Inspection.
    Validates that comments are mandatory upon rejection.
    """
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        write_only=True
    )

    class Meta:
        model = Inspection
        fields = ['id', 'task_id', 'decision', 'comments', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        """
        Custom validation: If decision is 'rejected', comments must not be empty.
        """
        if data['decision'] == 'rejected' and not data.get('comments'):
            raise ValidationError(
                {"comments": "Comments are mandatory when rejecting an inspection."}
            )
        
        # Further validation: Task must be ready for QA
        task = data['task_id']
        # Task must have status 'pending_qa' (waiting for QA Inspector)
        if task.status != 'pending_qa':
            raise ValidationError(
                {"task_id": f"Task is not ready for QA inspection. Current status: {task.get_status_display()}."}
            )

        return data


class SupervisorReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Supervisor to perform the final Review.
    """
    inspection_id = serializers.PrimaryKeyRelatedField(
        queryset=Inspection.objects.all(),
        write_only=True,
        source='inspection'
    )
    
    class Meta:
        model = SupervisorReview
        fields = ['id', 'inspection_id', 'decision', 'comments', 'created_at']
        read_only_fields = ['id', 'created_at']


class TesterReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Tester to perform final testing and approval.
    """
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = TesterReview
        fields = ['id', 'task_id', 'decision', 'comments', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, data):
        """
        Validate that comments are provided for rejections.
        """
        if data['decision'] == 'rejected' and not data.get('comments'):
            raise ValidationError(
                {"comments": "Comments are mandatory when rejecting a task during testing."}
            )
        
        # Task must be pending tester review
        task = data['task_id']
        if task.status != 'pending_tester':
            raise ValidationError(
                {"task_id": f"Task is not ready for tester review. Current status: {task.get_status_display()}."}
            )
        
        return data


