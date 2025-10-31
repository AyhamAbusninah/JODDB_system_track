# JODDB Backend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Business Logic](#business-logic)
8. [Setup & Installation](#setup--installation)
9. [Configuration](#configuration)
10. [Key Features](#key-features)

---

## Overview

JODDB (Job Order Database) Backend is a Django REST Framework-based API that manages a comprehensive job order tracking system for manufacturing and assembly operations. The system tracks job orders, devices, tasks, quality inspections, and performance metrics across multiple user roles.

**Purpose**: Enable efficient tracking and management of assembly/production workflows with role-based access control, real-time metrics, and quality assurance processes.

---

## Technology Stack

### Core Technologies
- **Framework**: Django 5.2.7
- **REST API**: Django REST Framework 3.16.1
- **Database**: SQLite (Development) / PostgreSQL (Production-ready)
- **Authentication**: JWT (djangorestframework-simplejwt 5.5.1)
- **Python Version**: 3.10+

### Key Dependencies
```
Django==5.2.7
djangorestframework==3.16.1
djangorestframework_simplejwt==5.5.1
django-cors-headers==4.9.0
django-filter==25.2
psycopg2-binary==2.9.11
python-decouple==3.8
pandas>=2.0.0
openpyxl>=3.1.0
```

---

## Project Structure

```
backend/
├── joddb_backend/          # Project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py            # Root URL routing
│   ├── wsgi.py            # WSGI entry point
│   └── asgi.py            # ASGI entry point
├── core/                   # Main application
│   ├── models.py          # Database models
│   ├── views.py           # API views and viewsets
│   ├── serializers.py     # DRF serializers
│   ├── serializers_auth.py # Authentication serializers
│   ├── permissions.py     # Custom permissions
│   ├── admin.py           # Django admin configuration
│   ├── signals.py         # Django signals
│   ├── metrics/           # Performance calculations
│   │   ├── calculations.py
│   │   └── serializers.py
│   ├── notifications/     # Notification utilities
│   │   └── utils.py
│   └── migrations/        # Database migrations
├── db.sqlite3             # SQLite database (dev)
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

---

## Database Models

### Core Models

#### 1. User (Custom User Model)
Extends Django's `AbstractUser` with role-based access.

```python
Fields:
- username: CharField (inherited)
- email: EmailField (inherited)
- password: CharField (inherited)
- role: CharField (choices: technician, quality_inspector, supervisor, planning, admin, tester)
- full_name: CharField
- is_active: BooleanField (inherited)
- date_joined: DateTimeField (inherited)
```

**Roles**:
- `technician`: Performs assembly/production tasks
- `quality_inspector`: Conducts quality inspections
- `supervisor`: Reviews and approves inspections
- `planning`: Creates job orders and manages operations
- `tester`: Performs testing tasks
- `admin`: System administrator

#### 2. Job (Template)
Represents a reusable job template (e.g., "iPhone 15 Assembly").

```python
Fields:
- id: AutoField (PK)
- name: CharField (unique)
- description: TextField
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

Relations:
- processes: One-to-Many → Process
- job_orders: One-to-Many → JobOrder
```

#### 3. Process (Task Template)
Defines individual steps within a Job template.

```python
Fields:
- id: AutoField (PK)
- job: ForeignKey → Job
- operation_name: CharField
- standard_time_seconds: IntegerField
- task_type: CharField (choices: technician, quality, tester)
- order: PositiveIntegerField

Relations:
- job: Many-to-One → Job
- tasks: One-to-Many → Task
```

#### 4. JobOrder
A specific production run instance created from a Job template.

```python
Fields:
- id: AutoField (PK)
- job: ForeignKey → Job (optional)
- order_code: CharField (unique)
- title: CharField
- description: TextField
- total_devices: IntegerField
- due_date: DateField
- status: CharField (choices: available, in_progress, done, rejected, archived)
- created_by: ForeignKey → User
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

Relations:
- job: Many-to-One → Job
- created_by: Many-to-One → User
- devices: One-to-Many → Device
- tasks: One-to-Many → Task
- reports: One-to-Many → Report
- metrics: One-to-Many → PerformanceMetric

Methods:
- get_progress_percentage(): Returns completion percentage
```

#### 5. Device
Individual units within a JobOrder (e.g., serial numbers).

```python
Fields:
- id: AutoField (PK)
- job_order: ForeignKey → JobOrder
- serial_number: CharField (unique)
- current_status: CharField (choices: pending, in_progress, completed, rejected)
- last_updated: DateTimeField (auto)
- created_at: DateTimeField (auto)

Relations:
- job_order: Many-to-One → JobOrder
- tasks: One-to-Many → Task
- inspections: One-to-Many → Inspection
```

#### 6. Task
Actual work items assigned to technicians for specific devices.

```python
Fields:
- id: AutoField (PK)
- process: ForeignKey → Process (optional, template reference)
- device: ForeignKey → Device
- job_order: ForeignKey → JobOrder
- technician: ForeignKey → User
- operation_name: CharField
- standard_time_seconds: IntegerField
- task_type: CharField (choices: technician, quality, tester)
- start_time: DateTimeField (nullable)
- end_time: DateTimeField (nullable)
- actual_time_seconds: IntegerField (nullable)
- status: CharField (choices: available, in_progress, pending-approval, approved, rejected, done)
- notes: TextField
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

Relations:
- device: Many-to-One → Device
- job_order: Many-to-One → JobOrder
- technician: Many-to-One → User
- reports: One-to-Many → Report
- inspections: One-to-Many → Inspection

Methods:
- calculate_efficiency(): Returns (standard_time / actual_time) * 100
```

**Task Status Flow**:
```
available → in_progress → pending-approval → approved/rejected → done
```

#### 7. Report
Documentation submitted by technicians and quality inspectors.

```python
Fields:
- id: AutoField (PK)
- task: ForeignKey → Task
- job_order: ForeignKey → JobOrder
- created_by: ForeignKey → User
- role_type: CharField (choices: technician, quality)
- content: TextField
- quantity: PositiveIntegerField
- start_time: DateTimeField (nullable)
- end_time: DateTimeField (nullable)
- actual_time_seconds: IntegerField (nullable)
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)

Relations:
- task: Many-to-One → Task
- job_order: Many-to-One → JobOrder
- created_by: Many-to-One → User
```

#### 8. Inspection
Quality inspector reviews of completed tasks.

```python
Fields:
- id: AutoField (PK)
- device: ForeignKey → Device
- task: ForeignKey → Task
- inspector: ForeignKey → User (nullable)
- decision: CharField (choices: pending, accepted, rejected)
- comments: TextField
- created_at: DateTimeField (auto)

Relations:
- device: Many-to-One → Device
- task: Many-to-One → Task
- inspector: Many-to-One → User
- supervisor_reviews: One-to-Many → SupervisorReview
```

#### 9. SupervisorReview
Supervisor's final approval/rejection of quality inspections.

```python
Fields:
- id: AutoField (PK)
- inspection: ForeignKey → Inspection
- supervisor: ForeignKey → User
- decision: CharField (choices: accepted, rejected)
- comments: TextField
- created_at: DateTimeField (auto)

Relations:
- inspection: Many-to-One → Inspection
- supervisor: Many-to-One → User
```

#### 10. PerformanceMetric
Computed performance metrics for technicians.

```python
Fields:
- id: AutoField (PK)
- job_order: ForeignKey → JobOrder (nullable)
- technician: ForeignKey → User
- date: DateField
- productivity: FloatField (nullable)
- efficiency: FloatField (nullable)
- utilization: FloatField (nullable)
- created_at: DateTimeField (auto)

Unique Together: (job_order, technician, date)
```

**Metrics Calculation**:
- **Productivity**: Tasks completed / time period
- **Efficiency**: Average (standard_time / actual_time) * 100
- **Utilization**: (actual_working_time / available_time) * 100

#### 11. Notification
System notifications for users.

```python
Fields:
- id: AutoField (PK)
- user: ForeignKey → User
- type: CharField (choices: task_rejected, task_accepted, approaching_deadline, quality_issue, efficiency_alert, report_submitted)
- message: TextField
- payload: JSONField
- read: BooleanField
- created_at: DateTimeField (auto)

Relations:
- user: Many-to-One → User
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1/
```

### Authentication Endpoints

#### POST /api/v1/auth/login/
Login and obtain JWT tokens.

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "technician",
    "full_name": "John Doe"
  }
}
```

#### POST /api/v1/auth/token/refresh/
Refresh access token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### POST /api/v1/auth/logout/
Blacklist refresh token (logout).

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### POST /api/v1/auth/register/
Register new user (public endpoint).

**Request:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "New User"
}
```

---

### Job Template Endpoints

#### GET /api/v1/jobs/
List all job templates with their processes.

**Permissions**: Authenticated users

**Response:**
```json
[
  {
    "id": 1,
    "name": "iPhone 15 Assembly",
    "description": "Complete assembly workflow",
    "processes": [
      {
        "id": 1,
        "operation_name": "Screen Installation",
        "standard_time_seconds": 300,
        "task_type": "technician",
        "order": 1
      }
    ],
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
]
```

#### POST /api/v1/jobs/
Create new job template with processes.

**Permissions**: Planning Engineers only

**Request:**
```json
{
  "name": "MacBook Assembly",
  "description": "Complete MacBook assembly workflow",
  "processes": [
    {
      "operation_name": "Motherboard Installation",
      "standard_time_seconds": 600,
      "task_type": "technician",
      "order": 1
    },
    {
      "operation_name": "Quality Check",
      "standard_time_seconds": 300,
      "task_type": "quality",
      "order": 2
    }
  ]
}
```

#### GET /api/v1/jobs/{id}/
Retrieve specific job template with all processes.

#### PATCH /api/v1/jobs/{id}/
Update job template (name/description only).

**Permissions**: Planning Engineers only

#### DELETE /api/v1/jobs/{id}/
Delete job template.

**Permissions**: Planning Engineers only

---

### Process Endpoints

#### GET /api/v1/processes/
List all processes (optionally filter by job_id).

**Query Parameters**:
- `job_id` (optional): Filter processes by job

#### POST /api/v1/processes/
Create new process for a job.

**Permissions**: Planning Engineers only

#### PATCH /api/v1/processes/{id}/
Update process details.

**Permissions**: Planning Engineers only

#### DELETE /api/v1/processes/{id}/
Delete process.

**Permissions**: Planning Engineers only

---

### Job Order Endpoints

#### GET /api/v1/job-orders/
List all job orders.

**Response:**
```json
[
  {
    "id": 1,
    "job": 1,
    "job_name": "iPhone 15 Assembly",
    "order_code": "JO-2024-001",
    "title": "Batch A - iPhone 15",
    "description": "First production batch",
    "total_devices": 100,
    "due_date": "2024-03-30",
    "status": "in_progress",
    "created_by": 2,
    "created_at": "2024-03-01T09:00:00Z",
    "updated_at": "2024-03-15T14:30:00Z"
  }
]
```

#### POST /api/v1/job-orders/
Create new job order.

**Permissions**: Planning Engineers only

**Request:**
```json
{
  "job": 1,
  "order_code": "JO-2024-002",
  "title": "Batch B - iPhone 15",
  "description": "Second production batch",
  "total_devices": 150,
  "due_date": "2024-04-15"
}
```

#### GET /api/v1/job-orders/{id}/
Retrieve specific job order details.

---

### Task Endpoints

#### GET /api/v1/tasks/
List tasks (filtered by user role).

**Role-Based Filtering**:
- Technicians: See only their assigned tasks
- Quality Inspectors: See tasks pending QA
- Supervisors/Planning: See all tasks

**Response:**
```json
[
  {
    "id": 1,
    "job_order": 1,
    "device": 5,
    "device_serial": "SN-001234",
    "operation_name": "Screen Installation",
    "standard_time_seconds": 300,
    "actual_time_seconds": 280,
    "efficiency": 107.14,
    "status": "done",
    "technician": 3,
    "technician_name": "John Doe",
    "start_time": "2024-03-15T09:00:00Z",
    "end_time": "2024-03-15T09:04:40Z",
    "notes": "Completed successfully",
    "created_at": "2024-03-15T08:30:00Z",
    "updated_at": "2024-03-15T09:05:00Z"
  }
]
```

#### POST /api/v1/tasks/
Create new task.

**Permissions**: Planning Engineers, Supervisors

**Request:**
```json
{
  "job_order": 1,
  "device_serial": "SN-001235",
  "process": 2,
  "operation_name": "Battery Installation",
  "task_type": "technician"
}
```

#### PATCH /api/v1/tasks/{id}/start/
Start a task (technician begins work).

**Permissions**: Technicians only (own tasks)

**Response:**
```json
{
  "id": 1,
  "status": "in_progress",
  "start_time": "2024-03-15T10:00:00Z"
}
```

#### PATCH /api/v1/tasks/{id}/end/
End a task (technician completes work).

**Permissions**: Technicians only (own tasks)

**Request:**
```json
{
  "notes": "Task completed, all checks passed"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "pending-approval",
  "end_time": "2024-03-15T10:05:20Z",
  "actual_time_seconds": 320,
  "efficiency": 93.75
}
```

#### GET /api/v1/tasks/summary/
Get task status summary (counts by status).

**Response:**
```json
{
  "available": 45,
  "in_progress": 12,
  "pending_approval": 8,
  "approved": 156,
  "rejected": 3,
  "done": 134
}
```

---

### Inspection Endpoints (Quality)

#### POST /api/v1/inspections/
Create quality inspection (accept/reject task).

**Permissions**: Quality Inspectors only

**Request:**
```json
{
  "task_id": 15,
  "decision": "accepted",
  "comments": "Quality standards met"
}
```

**Response:**
```json
{
  "id": 10,
  "task": 15,
  "device": 8,
  "inspector": 4,
  "decision": "accepted",
  "comments": "Quality standards met",
  "created_at": "2024-03-15T11:00:00Z"
}
```

#### GET /api/v1/inspections/
List all inspections.

**Permissions**: Quality Inspectors, Supervisors

---

### Supervisor Review Endpoints

#### POST /api/v1/supervisor-reviews/
Create supervisor review of inspection.

**Permissions**: Supervisors only

**Request:**
```json
{
  "inspection_id": 10,
  "decision": "accepted",
  "comments": "Inspection validated"
}
```

#### GET /api/v1/supervisor-reviews/
List all supervisor reviews.

**Permissions**: Supervisors only

---

### Metrics Endpoints

#### GET /api/v1/metrics/technician/{id}/
Get technician performance metrics.

**Query Parameters**:
- `date` (optional): Specific date (YYYY-MM-DD)

**Response:**
```json
{
  "technician_id": 3,
  "technician_name": "John Doe",
  "date": "2024-03-15",
  "productivity": 95.5,
  "average_efficiency": 103.2,
  "utilization": 87.3,
  "tasks_completed": 12
}
```

#### GET /api/v1/metrics/job-order/{id}/
Get job order progress and alerts.

**Response:**
```json
{
  "progress_percent": 65.5,
  "total_completed": 65,
  "total_rejected": 5,
  "total_devices": 100,
  "alerts": [
    {
      "type": "deadline_approaching",
      "message": "Job order due in 2 days",
      "severity": "medium"
    }
  ]
}
```

#### GET /api/v1/planner/statistics/
Get planner dashboard statistics.

**Permissions**: Planning Engineers only

**Response:**
```json
{
  "active_job_orders": 15,
  "due_this_week": 5,
  "avg_productivity": 92.3,
  "active_technicians": 8,
  "total_technicians": 12,
  "technician_utilization": 85.7,
  "overdue_tasks": 3,
  "pending_reviews": 7
}
```

---

### User Management Endpoints

#### GET /api/v1/users/
List all users.

**Permissions**: Planning Engineers, Supervisors

#### POST /api/v1/users/
Create new user.

**Permissions**: Planning Engineers only

**Request:**
```json
{
  "username": "new_tech",
  "email": "tech@example.com",
  "password": "secure_pass",
  "full_name": "New Technician",
  "role": "technician"
}
```

#### PATCH /api/v1/users/{id}/
Update user information.

**Permissions**: Planning Engineers only

#### DELETE /api/v1/users/{id}/
Delete user.

**Permissions**: Planning Engineers only

---

### Data Import/Export Endpoints

#### POST /api/v1/data/import/job-order/
Import job orders from Excel/CSV file.

**Permissions**: Planning Engineers only

**Request**: Multipart form-data with file

**Expected Excel Format**:
```
| order_code | title | description | total_devices | due_date | serial_numbers |
|------------|-------|-------------|---------------|----------|----------------|
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_job_orders_created": 5,
    "total_devices_created": 250,
    "created_job_orders": ["JO-001", "JO-002"],
    "duplicates": [],
    "errors": []
  }
}
```

#### GET /api/v1/data/export/daily-report/
Export daily work report.

**Query Parameters**:
- `date`: Date (YYYY-MM-DD)
- `format`: csv or excel

**Response**: File download (CSV or Excel)

#### GET /api/v1/reports/joborder/{id}/export/pdf
Export job order comprehensive PDF report.

**Response**: PDF file with:
- Job order details
- Device list and status
- Task details and efficiency
- Quality inspection results
- Summary statistics

---

## Authentication & Authorization

### JWT Authentication

The system uses JWT (JSON Web Tokens) for stateless authentication.

**Token Lifecycle**:
- **Access Token**: Valid for 8 hours
- **Refresh Token**: Valid for 7 days
- **Rotation**: Enabled (new refresh token on each refresh)
- **Blacklisting**: Enabled (tokens blacklisted on logout)

**Headers**:
```
Authorization: Bearer <access_token>
```

### Role-Based Permissions

Custom permission classes in `core/permissions.py`:

#### IsRoleRequired
Base permission class for role checking.

#### IsPlanningEngineer
Restricts access to users with role='planning'.

**Used in**:
- Job/Process creation, update, delete
- Job Order creation
- User management
- Data import

#### IsSupervisor
Restricts access to users with role='supervisor'.

**Used in**:
- Supervisor reviews
- Cross-role data access

### Permission Matrix

| Endpoint | Technician | Quality | Supervisor | Planning | Admin |
|----------|-----------|---------|------------|----------|-------|
| View Jobs | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/Edit Jobs | ✗ | ✗ | ✗ | ✓ | ✓ |
| View Job Orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Job Orders | ✗ | ✗ | ✗ | ✓ | ✓ |
| View Own Tasks | ✓ | ✗ | ✓ | ✓ | ✓ |
| Start/End Tasks | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Inspections | ✗ | ✓ | ✗ | ✗ | ✗ |
| Supervisor Reviews | ✗ | ✗ | ✓ | ✗ | ✓ |
| User Management | ✗ | ✗ | ✗ | ✓ | ✓ |
| View Metrics | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Business Logic

### Key Business Rules

#### 1. Task Workflow
```
Planning creates Job Order with Devices
↓
Tasks created from Process templates
↓
Technician starts task (status: in_progress)
↓
Technician ends task (status: pending-approval)
↓
Inspection auto-created (decision: pending)
↓
Quality Inspector reviews (decision: accepted/rejected)
↓
Supervisor reviews inspection (optional)
↓
Task marked as done
```

#### 2. Efficiency Calculation
```python
efficiency = (standard_time_seconds / actual_time_seconds) * 100
```
- **> 100%**: Better than standard (good)
- **100%**: Exactly on time
- **< 100%**: Slower than standard
- **< 75%**: Triggers efficiency alert

#### 3. Metrics Calculation

**Productivity**:
```python
productivity = tasks_completed / time_period
```

**Utilization** (8-hour shift = 28,800 seconds):
```python
utilization = (sum_of_actual_time / 28800) * 100
```

**Average Efficiency**:
```python
avg_efficiency = mean([task.efficiency for task in tasks])
```

#### 4. Alerts & Notifications

**Deadline Warnings**:
- Triggered when job order due date is within 2 days (configurable)

**Quality Issues**:
- Triggered when rejection count ≥ 3 (configurable)

**Efficiency Alerts**:
- Triggered when task efficiency < 75% (configurable)

### Configuration Constants

In `settings.py`:
```python
TOTAL_AVAILABLE_TIME_SECONDS = 28800  # 8-hour shift
EFFICIENCY_ALERT_THRESHOLD = 75.0
DEADLINE_WARNING_DAYS = 2
QUALITY_ISSUE_REJECTION_COUNT = 3
```

---

## Setup & Installation

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)
- Virtual environment tool (venv or virtualenv)
- SQLite (included with Python) or PostgreSQL

### Installation Steps

#### 1. Clone Repository
```bash
cd backend
```

#### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables
Create `.env` file in backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL - optional)
# DB_NAME=joddb_mvp
# DB_USER=joddb_user
# DB_PASSWORD=joddb_pass_2025
# DB_HOST=localhost
# DB_PORT=5432
```

#### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 6. Create Superuser
```bash
python manage.py createsuperuser
```

#### 7. Load Initial Data (Optional)
```bash
python manage.py loaddata fixtures/initial_data.json
```

#### 8. Run Development Server
```bash
python manage.py runserver
```

API available at: `http://localhost:8000/api/v1/`
Admin panel at: `http://localhost:8000/admin/`

---

## Configuration

### CORS Settings

Configured for frontend integration:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
```

### Database Configuration

**Development (SQLite)**:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Production (PostgreSQL)** - Uncomment in settings.py:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}
```

### Time Zone
```python
TIME_ZONE = 'Asia/Amman'
USE_TZ = True
```

---

## Key Features

### 1. Role-Based Access Control (RBAC)
- Six distinct user roles with granular permissions
- JWT-based stateless authentication
- Automatic role validation on endpoints

### 2. Comprehensive Task Management
- Task lifecycle from creation to completion
- Automatic efficiency calculation
- Real-time status tracking
- Notes and documentation support

### 3. Quality Assurance Workflow
- Multi-level quality inspection
- Supervisor review layer
- Automatic inspection creation
- Decision tracking and audit trail

### 4. Performance Metrics
- Real-time technician performance tracking
- Job order progress monitoring
- Efficiency, productivity, and utilization metrics
- Configurable alert thresholds

### 5. Data Import/Export
- Excel/CSV job order import
- Daily report export (CSV/Excel)
- Comprehensive PDF reports
- Batch device creation

### 6. Notification System
- Task rejection/acceptance notifications
- Deadline warnings
- Quality issue alerts
- Efficiency alerts

### 7. Audit Trail
- Automatic timestamp tracking (created_at, updated_at)
- User action tracking
- Status change history
- Complete data lineage

### 8. API Design
- RESTful architecture
- Consistent response formats
- Pagination support
- Query parameter filtering
- Comprehensive error handling

---

## API Response Formats

### Success Response
```json
{
  "id": 1,
  "field": "value",
  ...
}
```

### Paginated Response
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/tasks/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error Response
```json
{
  "detail": "Error message here",
  "field_name": ["Specific field error"]
}
```

### Validation Error
```json
{
  "username": ["This field is required."],
  "email": ["Enter a valid email address."]
}
```

---

## Testing

### Run Tests
```bash
python manage.py test
```

### Create Test Data
```bash
python manage.py shell
# Use Django shell to create test data
```

---

## Deployment Considerations

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure proper `SECRET_KEY`
- [ ] Set up PostgreSQL database
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up static file serving
- [ ] Configure HTTPS
- [ ] Set up proper logging
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Review CORS settings for production domains

### Environment Variables (Production)
```env
SECRET_KEY=<strong-random-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=joddb_production
DB_USER=joddb_prod_user
DB_PASSWORD=<strong-password>
DB_HOST=db.yourdomain.com
DB_PORT=5432
```

---

## Maintenance

### Database Migrations
```bash
# Create migration
python manage.py makemigrations

# View SQL
python manage.py sqlmigrate core 0001

# Apply migrations
python manage.py migrate
```

### Database Backup
```bash
# SQLite
cp db.sqlite3 backups/db_$(date +%Y%m%d).sqlite3

# PostgreSQL
pg_dump -U joddb_user joddb_mvp > backup_$(date +%Y%m%d).sql
```

### Clear Cache/Reset
```bash
# Clear sessions
python manage.py clearsessions

# Flush database (caution!)
python manage.py flush
```

---

## Support & Documentation

- **Django Documentation**: https://docs.djangoproject.com/
- **DRF Documentation**: https://www.django-rest-framework.org/
- **JWT Documentation**: https://django-rest-framework-simplejwt.readthedocs.io/

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Maintainer**: JODDB Development Team
