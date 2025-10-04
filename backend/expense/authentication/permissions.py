from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsAdminUser(BasePermission):
    """
    Custom permission specifically for admin functionality.
    This is an alias for IsAdmin to match the requirements.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsManager(BasePermission):
    """
    Custom permission to only allow manager users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'MANAGER'
        )


class IsEmployee(BasePermission):
    """
    Custom permission to only allow employee users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'EMPLOYEE'
        )


class IsAdminOrManager(BasePermission):
    """
    Custom permission to allow admin or manager users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'MANAGER']
        )


class IsAdminOrSelf(BasePermission):
    """
    Custom permission to allow admin users or the user themselves to access the view.
    Useful for user detail/update endpoints.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any user object
        if request.user.role == 'ADMIN':
            return True
        
        # Users can only access their own object
        return obj == request.user


class IsManagerOrSelf(BasePermission):
    """
    Custom permission to allow manager users or the user themselves to access the view.
    Managers can also access their subordinates.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any user object
        if request.user.role == 'ADMIN':
            return True
        
        # Manager can access their own object and their subordinates
        if request.user.role == 'MANAGER':
            return (obj == request.user or 
                    obj.manager == request.user)
        
        # Users can only access their own object
        return obj == request.user


class IsSameCompany(BasePermission):
    """
    Custom permission to ensure users can only access data from their own company.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (hasattr(request.user, 'company') and request.user.company) or
            (hasattr(request.user, 'company_id') and request.user.company_id)
        )
    
    def has_object_permission(self, request, view, obj):
        # Check if object has company relationship
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        
        # Check if object has company_id attribute
        if hasattr(obj, 'company_id'):
            return obj.company_id == request.user.company_id
        
        # Check if object is a user and compare company
        if hasattr(obj, 'user') and hasattr(obj.user, 'company'):
            return obj.user.company == request.user.company
        
        # For user objects
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        
        return True


class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to allow admin users or object owners to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == 'ADMIN':
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'employee'):
            return obj.employee == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False