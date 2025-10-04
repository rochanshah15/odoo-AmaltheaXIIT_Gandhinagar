from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with role-based access control.
    """
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGER = 'MANAGER', 'Manager'
        EMPLOYEE = 'EMPLOYEE', 'Employee'
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.EMPLOYEE,
        help_text="User role for permission management"
    )
    
    # Additional fields based on frontend requirements
    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Country of the user/company"
    )
    
    # Company relationship - FK to Company model
    company = models.ForeignKey(
        'admin_panel.Company',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='users',
        help_text="Company this user belongs to"
    )
    
    # Manager relationship for employee hierarchy
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='managed_employees',
        help_text="Manager of this user (for employees)"
    )
    
    # User status
    is_active_user = models.BooleanField(
        default=True,
        help_text="Whether this user account is active"
    )
    
    # Timestamps
    last_login_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Last login timestamp"
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def get_full_name_display(self):
        """Return user's full name or username if names are not set"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def get_company_identifier(self):
        """Return company identifier for backward compatibility"""
        if self.company:
            return f"company-{self.company.id}"
        return None
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
