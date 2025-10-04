from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users (alias for IsAdmin).
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsManager(permissions.BasePermission):
    """
    Permission to only allow manager users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'MANAGER']
        )


class IsEmployee(permissions.BasePermission):
    """
    Permission to only allow employee users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
        )


class IsSameCompany(permissions.BasePermission):
    """
    Permission to only allow access to objects from the same company.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'company') and 
            request.user.company is not None
        )
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'company') or request.user.company is None:
            return False
        
        # Check if the object has a company field
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        
        # Check if the object has a user field with company
        if hasattr(obj, 'user') and hasattr(obj.user, 'company'):
            return obj.user.company == request.user.company
        
        # Check if the object has an employee field with company
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'company'):
            return obj.employee.company == request.user.company
        
        # Check if the object is a User and has same company
        if isinstance(obj, User):
            return obj.company == request.user.company
        
        return True


class IsOwnerOrManager(permissions.BasePermission):
    """
    Permission to only allow owners of an object or their managers to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin can access everything in their company
        if request.user.role == 'ADMIN':
            return True
        
        # Check if the object has an employee field (for expenses)
        if hasattr(obj, 'employee'):
            # Owner can access their own objects
            if obj.employee == request.user:
                return True
            
            # Manager can access subordinates' objects
            if (request.user.role == 'MANAGER' and 
                obj.employee.manager == request.user):
                return True
        
        # Check if the object is the user themselves
        if isinstance(obj, User):
            # Users can access their own profile
            if obj == request.user:
                return True
            
            # Managers can access their subordinates
            if (request.user.role == 'MANAGER' and 
                obj.manager == request.user):
                return True
        
        return False


class IsManagerOrAbove(permissions.BasePermission):
    """
    Permission to only allow manager-level users and above.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'MANAGER']
        )


class CanApproveExpenses(permissions.BasePermission):
    """
    Permission to check if user can approve expenses.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'MANAGER']
        )
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin can approve any expense in their company
        if request.user.role == 'ADMIN':
            return obj.company == request.user.company
        
        # Managers can approve expenses from their subordinates
        if request.user.role == 'MANAGER':
            return (
                obj.company == request.user.company and
                obj.employee.manager == request.user
            )
        
        return False


class CanManageWorkflows(permissions.BasePermission):
    """
    Permission to check if user can manage approval workflows.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )
    
    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN' and
            hasattr(obj, 'company') and
            obj.company == request.user.company
        )