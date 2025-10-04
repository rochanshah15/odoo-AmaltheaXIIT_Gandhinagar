from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Company(models.Model):
    """
    Model to represent companies/organizations
    """
    name = models.CharField(
        max_length=200,
        help_text="Company name"
    )
    
    default_currency = models.CharField(
        max_length=3,
        default='USD',
        help_text="Default currency code for the company (e.g., USD, EUR, GBP)"
    )
    
    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Company's country"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ApprovalWorkflow(models.Model):
    """
    Model to define approval workflows for expenses
    """
    class WorkflowType(models.TextChoices):
        SEQUENTIAL = 'SEQUENTIAL', 'Sequential'
        CONDITIONAL = 'CONDITIONAL', 'Conditional'
    
    name = models.CharField(
        max_length=200,
        help_text="Name of the approval workflow"
    )
    
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='approval_workflows',
        help_text="Company this workflow belongs to"
    )
    
    workflow_type = models.CharField(
        max_length=20,
        choices=WorkflowType.choices,
        default=WorkflowType.SEQUENTIAL,
        help_text="Type of approval workflow"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Description of the workflow"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this workflow is active"
    )
    
    minimum_approval_percentage = models.IntegerField(
        default=50,
        help_text="Minimum percentage of approvers required for approval"
    )
    
    manager_approval_required = models.BooleanField(
        default=True,
        help_text="Whether manager approval is required first"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Approval Workflow'
        verbose_name_plural = 'Approval Workflows'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.company.name})"


class ApprovalStep(models.Model):
    """
    Model to define sequential approval steps
    """
    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.CASCADE,
        related_name='approval_steps',
        help_text="Workflow this step belongs to"
    )
    
    step_number = models.IntegerField(
        help_text="Order of this step in the workflow"
    )
    
    approver_role = models.CharField(
        max_length=20,
        choices=[
            ('MANAGER', 'Manager'),
            ('FINANCE', 'Finance'),
            ('DIRECTOR', 'Director'),
            ('ADMIN', 'Admin'),
        ],
        help_text="Role required for this approval step"
    )
    
    approver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='approval_steps',
        help_text="Specific user who can approve at this step"
    )
    
    is_required = models.BooleanField(
        default=True,
        help_text="Whether this step is required for approval"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Approval Step'
        verbose_name_plural = 'Approval Steps'
        ordering = ['workflow', 'step_number']
        unique_together = ['workflow', 'step_number']
    
    def __str__(self):
        return f"{self.workflow.name} - Step {self.step_number}"


class ConditionalRule(models.Model):
    """
    Model to define conditional approval rules
    """
    class RuleType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage'
        SPECIFIC_APPROVER = 'SPECIFIC_APPROVER', 'Specific Approver'
        HYBRID = 'HYBRID', 'Hybrid'
    
    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.CASCADE,
        related_name='conditional_rules',
        help_text="Workflow this rule belongs to"
    )
    
    rule_type = models.CharField(
        max_length=20,
        choices=RuleType.choices,
        help_text="Type of conditional rule"
    )
    
    percentage_threshold = models.IntegerField(
        null=True,
        blank=True,
        help_text="Percentage threshold for approval (if applicable)"
    )
    
    specific_approver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conditional_rules',
        help_text="Specific approver for this rule (if applicable)"
    )
    
    amount_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount threshold that triggers this rule"
    )
    
    condition_description = models.TextField(
        blank=True,
        help_text="Description of the condition"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this rule is active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Conditional Rule'
        verbose_name_plural = 'Conditional Rules'
        ordering = ['workflow', 'amount_threshold']
    
    def __str__(self):
        return f"{self.workflow.name} - {self.rule_type}"


class UserApprovalRule(models.Model):
    """
    Model to define user-specific approval rules
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='approval_rules',
        help_text="User this rule applies to"
    )
    
    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.CASCADE,
        related_name='user_rules',
        help_text="Workflow to use for this user"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Description of this rule"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this rule is active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Approval Rule'
        verbose_name_plural = 'User Approval Rules'
        unique_together = ['user', 'workflow']
    
    def __str__(self):
        return f"{self.user.username} - {self.workflow.name}"
