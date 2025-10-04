from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    """
    Admin configuration for Expense model
    """
    list_display = [
        'id', 'employee', 'category', 'amount', 'currency', 
        'status', 'expense_date', 'created_at'
    ]
    list_filter = [
        'status', 'category', 'currency', 'expense_date', 'created_at'
    ]
    search_fields = [
        'employee__username', 'employee__email', 'employee__first_name', 
        'employee__last_name', 'description'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Expense Information', {
            'fields': ('employee', 'amount', 'currency', 'category', 'description', 'expense_date', 'receipt')
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'approval_date', 'approval_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        
        # Superusers can see all expenses
        if request.user.is_superuser:
            return qs
        
        # Admins can see all expenses in their company
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return qs.filter(employee__company_id=request.user.company_id)
        
        # Regular users can only see their own expenses
        return qs.filter(employee=request.user)
    
    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        
        # Superusers can edit all
        if request.user.is_superuser:
            return True
        
        # Admins can edit expenses in their company
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return obj.employee.company_id == request.user.company_id
        
        # Users can edit their own pending expenses
        return obj.employee == request.user and obj.is_pending
    
    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        
        # Superusers can delete all
        if request.user.is_superuser:
            return True
        
        # Admins can delete expenses in their company
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return obj.employee.company_id == request.user.company_id
        
        # Users can delete their own pending expenses
        return obj.employee == request.user and obj.is_pending
