from django.contrib import admin
from .models import User, JobOrder, Device, Task, Report, Inspection, SupervisorReview, PerformanceMetric, Notification, Job, Process

# Inline admin for Process (to show processes within Job admin)
class ProcessInline(admin.TabularInline):
    model = Process
    extra = 0
    fields = ['operation_name', 'task_type', 'standard_time_seconds', 'order']
    ordering = ['order']

# Job admin with inline processes
@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'process_count', 'created_at']
    search_fields = ['name', 'description']
    inlines = [ProcessInline]
    
    def process_count(self, obj):
        return obj.processes.count()
    process_count.short_description = 'Number of Processes'

# Process admin
@admin.register(Process)
class ProcessAdmin(admin.ModelAdmin):
    list_display = ['operation_name', 'job', 'task_type', 'standard_time_seconds', 'order']
    list_filter = ['job', 'task_type']
    search_fields = ['operation_name', 'job__name']
    ordering = ['job', 'order']

admin.site.register(User)
admin.site.register(JobOrder)
admin.site.register(Device)
admin.site.register(Task)
admin.site.register(Report)
admin.site.register(Inspection)
admin.site.register(SupervisorReview)
admin.site.register(PerformanceMetric)
admin.site.register(Notification)