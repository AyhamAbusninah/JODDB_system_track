"""
URL configuration for joddb_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# joddb_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,     # For /token/refresh/
    TokenBlacklistView    # For /logout/
)
from core.views import UserRegistrationView # Import the new view
from core.serializers_auth import CustomTokenObtainPairView  # Custom login view
from rest_framework.routers import DefaultRouter
from core.views import (
    JobViewSet,
    ProcessViewSet,
    JobOrderViewSet, 
    TechnicianTaskViewSet,
    UserManagementViewSet,
    TechnicianMetricsView,
    JobOrderMetricsView,
    PlannerStatisticsView,  # NEW: Planner statistics
    ExcelImportView,
    DailyReportExportView,
    InspectionViewSet,
    SupervisorReviewViewSet,
    TesterReviewViewSet,
    TaskStatusSummaryView,
    JobOrderPDFExportView,  # NEW: PDF export
    get_inspection_for_task,  # Endpoint to fetch inspection for supervisor review
)


# Router for ViewSets
router = DefaultRouter()
router.register(r'jobs', JobViewSet)
router.register(r'processes', ProcessViewSet)
router.register(r'job-orders', JobOrderViewSet)
router.register(r'tasks', TechnicianTaskViewSet, basename='task')
router.register(r'users', UserManagementViewSet, basename='user-management')
router.register(r'inspections', InspectionViewSet, basename='inspection')
router.register(r'supervisor-reviews', SupervisorReviewViewSet, basename='supervisor-review')
router.register(r'tester-reviews', TesterReviewViewSet, basename='tester-review')


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Get inspection for supervisor review
    path('api/v1/inspections/task/<int:task_id>/', get_inspection_for_task, name='get-inspection-for-task'),
    
    # --- API Authentication Endpoints ---
    path('api/v1/auth/register/', UserRegistrationView.as_view(), name='register'),
    
    # 1. Login (Obtain Access and Refresh Tokens)
    path('api/v1/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # 2. Refresh Token (Get a new Access Token)
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Optional: Logout (Blacklist the Refresh Token)
    path('api/v1/auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # --- Core Application Endpoints ---
    path('api/v1/', include(router.urls)),
    
    # Metrics endpoints
    path('api/v1/metrics/technician/<int:id>/', TechnicianMetricsView.as_view(), name='technician-metrics'),
    path('api/v1/metrics/job-order/<int:id>/', JobOrderMetricsView.as_view(), name='job-order-metrics'),
    
    # Planner statistics endpoint
    path('api/v1/planner/statistics/', PlannerStatisticsView.as_view(), name='planner-statistics'),
    
    # Data Import/Export endpoints
    path('api/v1/data/import/job-order/', ExcelImportView.as_view(), name='import-job-orders'),
    path('api/v1/data/export/daily-report/', DailyReportExportView.as_view(), name='export-daily-report'),
    path('api/v1/tasks/summary/', TaskStatusSummaryView.as_view(), name='task-summary'),
    
    # PDF Report Export
    path('api/v1/reports/joborder/<int:id>/export/pdf', JobOrderPDFExportView.as_view(), name='export-job-order-pdf'),
]
