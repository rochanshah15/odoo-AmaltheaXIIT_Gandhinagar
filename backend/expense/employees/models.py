from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
import os

User = get_user_model()


def expense_receipt_path(instance, filename):
    """Generate file path for expense receipts"""
    # File will be uploaded to MEDIA_ROOT/receipts/user_<id>/<filename>
    return f'receipts/user_{instance.employee.id}/{filename}'


class Expense(models.Model):
    """
    Model to represent employee expense submissions
    """
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
    
    class Category(models.TextChoices):
        TRAVEL = 'TRAVEL', 'Travel'
        ACCOMMODATION = 'ACCOMMODATION', 'Accommodation'
        MEALS = 'MEALS', 'Meals & Entertainment'
        OFFICE_SUPPLIES = 'OFFICE_SUPPLIES', 'Office Supplies'
        SOFTWARE = 'SOFTWARE', 'Software & Subscriptions'
        TRAINING = 'TRAINING', 'Training & Education'
        COMMUNICATION = 'COMMUNICATION', 'Communication'
        TRANSPORTATION = 'TRANSPORTATION', 'Transportation'
        EQUIPMENT = 'EQUIPMENT', 'Equipment'
        OTHER = 'OTHER', 'Other'
    
    # Core expense information
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses',
        help_text="Employee who submitted this expense"
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Expense amount"
    )
    
    currency = models.CharField(
        max_length=3,
        default='USD',
        help_text="Currency code (e.g., USD, EUR, GBP)"
    )
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        help_text="Expense category"
    )
    
    description = models.TextField(
        help_text="Detailed description of the expense"
    )
    
    expense_date = models.DateField(
        help_text="Date when the expense was incurred"
    )
    
    # Status and workflow
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Current status of the expense"
    )
    
    # File upload
    receipt = models.FileField(
        upload_to=expense_receipt_path,
        blank=True,
        null=True,
        help_text="Receipt or proof of expense"
    )
    
    # Approval information
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses',
        help_text="Manager or admin who approved/rejected this expense"
    )
    
    approval_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when the expense was approved/rejected"
    )
    
    approval_notes = models.TextField(
        blank=True,
        help_text="Notes from the approver"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
    
    def __str__(self):
        return f"{self.employee.username} - {self.category} - {self.amount} {self.currency}"
    
    @property
    def is_pending(self):
        return self.status == self.Status.PENDING
    
    @property
    def is_approved(self):
        return self.status == self.Status.APPROVED
    
    @property
    def is_rejected(self):
        return self.status == self.Status.REJECTED
    
    def can_be_edited_by(self, user):
        """Check if the expense can be edited by the given user"""
        # Only the employee who created it can edit, and only if it's pending
        return self.employee == user and self.is_pending
    
    def can_be_viewed_by(self, user):
        """Check if the expense can be viewed by the given user"""
        # Employee can view their own expenses
        if self.employee == user:
            return True
        
        # Admins can view all expenses
        if user.role == 'ADMIN':
            return True
        
        # Managers can view expenses from their company
        if user.role == 'MANAGER' and user.company_id == self.employee.company_id:
            return True
        
        return False
