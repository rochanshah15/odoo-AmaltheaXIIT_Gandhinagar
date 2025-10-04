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
    
    # Company context - users belong to a company
    company_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Company identifier for multi-tenant support"
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
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def save(self, *args, **kwargs):
        # Auto-generate company_id for the first admin user
        if not self.company_id and self.role == self.Role.ADMIN:
            import uuid
            self.company_id = f"company-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
