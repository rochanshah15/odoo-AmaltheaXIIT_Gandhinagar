from rest_framework import serializers
from employees.models import Expense
from authentication.models import User


class ExpenseApprovalActionSerializer(serializers.Serializer):
    """
    Serializer for expense approval/rejection actions by managers
    """
    status = serializers.ChoiceField(
        choices=['APPROVED', 'REJECTED'],
        help_text="New status for the expense"
    )
    approval_notes = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Optional notes from the manager"
    )
    
    def validate_status(self, value):
        """Ensure status is valid"""
        if value not in ['APPROVED', 'REJECTED']:
            raise serializers.ValidationError("Status must be either 'APPROVED' or 'REJECTED'")
        return value


class ManagerPendingExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for expenses pending manager approval
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id',
            'employee',
            'employee_name', 
            'employee_username',
            'amount',
            'currency',
            'category',
            'category_display',
            'description',
            'expense_date',
            'status',
            'status_display',
            'receipt',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'employee', 'created_at', 'updated_at']


class ManagerExpenseDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for manager's expense review including approval history
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id',
            'employee',
            'employee_name',
            'employee_username', 
            'employee_email',
            'amount',
            'currency',
            'category',
            'category_display',
            'description',
            'expense_date',
            'status',
            'status_display',
            'receipt',
            'approved_by',
            'approved_by_name',
            'approval_date',
            'approval_notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'employee', 'approved_by', 'approval_date', 
            'created_at', 'updated_at'
        ]


class ManagerDashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for manager dashboard statistics
    """
    pending_count = serializers.IntegerField()
    total_team_expenses = serializers.IntegerField()
    total_amount_pending = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_amount_approved_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    team_members_count = serializers.IntegerField()


class ManagerTeamMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for team members under a manager
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    total_expenses = serializers.IntegerField(read_only=True)
    pending_expenses = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'total_expenses',
            'pending_expenses',
            'date_joined'
        ]
        read_only_fields = ['id', 'username', 'email', 'date_joined']