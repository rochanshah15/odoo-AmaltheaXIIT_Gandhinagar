from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for the User model
    """
    list_display = ('username', 'email', 'role', 'company_id', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'date_joined', 'company_id')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'company_id')
    ordering = ('date_joined',)
    
    # Fields to display when viewing a user
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('role', 'country', 'company_id', 'manager')
        }),
    )
    
    # Fields to display when creating a new user
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': ('role', 'country', 'company_id', 'manager')
        }),
    )
