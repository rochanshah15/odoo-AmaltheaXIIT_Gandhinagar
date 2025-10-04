from rest_framework import permissions
from .models import Expense


class IsOwnerOrManagerOrAdmin(permissions.BasePermission):
    """
    Permission to ensure users can only access their own expenses,
    or managers/admins can access expenses from their company
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Check if the expense can be viewed by the user
        return obj.can_be_viewed_by(request.user)


class IsOwnerAndPending(permissions.BasePermission):
    """
    Permission to ensure only the owner can edit their own pending expenses
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # For update/delete operations, only owner can modify pending expenses
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return obj.can_be_edited_by(request.user)
        
        # For read operations, use the general permission
        return obj.can_be_viewed_by(request.user)


class IsManagerOrAdmin(permissions.BasePermission):
    """
    Permission for managers and admins to approve/reject expenses
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['MANAGER', 'ADMIN']
        )
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admins can approve any expense
        if user.role == 'ADMIN':
            return True
        
        # Managers can approve expenses from their company
        if user.role == 'MANAGER':
            return user.company_id == obj.employee.company_id
        
        return False


class IsEmployee(permissions.BasePermission):
    """
    Permission to ensure only employees can create expenses
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'EMPLOYEE'
        )