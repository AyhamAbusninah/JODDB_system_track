# core/permissions.py
from rest_framework import permissions


class IsRoleRequired(permissions.BasePermission):
    """
    Base class for role-based access control.
    
    To use with specific roles, create subclasses or override allowed_roles.
    Default allows all authenticated users. Subclasses should set allowed_roles.
    
    Example subclass:
        class IsPlanningEngineer(IsRoleRequired):
            allowed_roles = ['planning', 'admin']
    """
    
    # Override this in subclasses to specify allowed roles
    allowed_roles = []
    
    def has_permission(self, request, view):
        """
        Check if the authenticated user's role is in the allowed roles list.
        """
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers always have access
        if request.user.is_superuser:
            return True
        
        # If no specific roles required, allow all authenticated users
        if not self.allowed_roles:
            return True
        
        # Check if user's role is in allowed roles
        user_role = getattr(request.user, 'role', None)
        
        if not user_role:
            return False
        
        return user_role in self.allowed_roles


# Convenience permission classes for common role combinations
class IsPlanningEngineer(IsRoleRequired):
    """Only Planning Engineers can access"""
    allowed_roles = ['planning', 'admin']


class IsTechnician(IsRoleRequired):
    """Only Technicians can access"""
    allowed_roles = ['technician', 'admin']


class IsQualityInspector(IsRoleRequired):
    """Only Quality Inspectors can access"""
    allowed_roles = ['quality', 'admin']


class IsSupervisor(IsRoleRequired):
    """Only Supervisors can access"""
    allowed_roles = ['supervisor', 'admin']


class IsAdmin(IsRoleRequired):
    """Only System Admins can access"""
    allowed_roles = ['admin']


class IsTechnicianOrAll(IsRoleRequired):
    """Technicians, Testers, Admins, Planning, Supervisors, Quality can access"""
    allowed_roles = ['technician', 'tester', 'admin', 'planning', 'supervisor', 'quality']


class IsQualityOrTesterOrAdmin(IsRoleRequired):
    """Quality Inspectors, Testers, and Admins can access"""
    allowed_roles = ['quality', 'tester', 'admin']


class IsPlanningOrAdminOrSupervisorOrQuality(IsRoleRequired):
    """Planning, Admin, Supervisor, Quality can access"""
    allowed_roles = ['admin', 'planning', 'supervisor', 'quality']


class IsPlanningOrAdmin(IsRoleRequired):
    """Planning Engineers and Admins can access"""
    allowed_roles = ['planning', 'admin']


class IsSupervisorOrAdmin(IsRoleRequired):
    """Supervisors and Admins can access"""
    allowed_roles = ['supervisor', 'admin']


class IsSupervisorOrPlanningOrAdmin(IsRoleRequired):
    """Supervisors, Planning Engineers, and Admins can access"""
    allowed_roles = ['supervisor', 'planning', 'admin']


class IsTesterOrAdmin(IsRoleRequired):
    """Testers and Admins can access"""
    allowed_roles = ['tester', 'admin']


class IsTesterOrSupervisorOrAdmin(IsRoleRequired):
    """Testers, Supervisors, and Admins can access"""
    allowed_roles = ['tester', 'supervisor', 'admin']


class IsQualityOrTesterOrSupervisorOrAdmin(IsRoleRequired):
    """Quality Inspectors, Testers, Supervisors, and Admins can access"""
    allowed_roles = ['quality', 'tester', 'supervisor', 'admin']



class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to any authenticated user,
    but write access only to planning/supervisor/admin roles.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for staff roles
        user_role = getattr(request.user, 'role', None)
        return user_role in ['planning', 'supervisor', 'admin'] or request.user.is_superuser