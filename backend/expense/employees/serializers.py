from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Expense

User = get_user_model()


class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for Expense model with validation and custom field handling
    """
    
    # Read-only fields for response
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    # File upload handling
    receipt = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'amount', 'currency', 'category', 'category_display',
            'description', 'expense_date', 'status', 'status_display',
            'receipt', 'employee', 'employee_name', 'employee_username',
            'approved_by', 'approved_by_name', 'approval_date', 'approval_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'employee', 'status', 'approved_by', 'approval_date',
            'approval_notes', 'created_at', 'updated_at'
        ]
        
    def validate_amount(self, value):
        """Validate expense amount"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if value > 10000:  # Set a reasonable upper limit
            raise serializers.ValidationError("Amount cannot exceed $10,000. Please contact admin for larger expenses.")
        return value
    
    def validate_expense_date(self, value):
        """Validate expense date"""
        from datetime import date, timedelta
        
        today = date.today()
        max_past_date = today - timedelta(days=90)  # 3 months back
        
        if value > today:
            raise serializers.ValidationError("Expense date cannot be in the future.")
        if value < max_past_date:
            raise serializers.ValidationError("Expense date cannot be more than 3 months old.")
        
        return value
    
    def validate_receipt(self, value):
        """Validate receipt file"""
        if value:
            # Check file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError("File size cannot exceed 5MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, GIF images and PDF files are allowed."
                )
        
        return value
    
    def create(self, validated_data):
        """Create expense with employee automatically set from request user"""
        # The employee field should be set from the authenticated user
        request = self.context.get('request')
        if request and request.user:
            validated_data['employee'] = request.user
        
        return super().create(validated_data)


class ExpenseListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for expense list views
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'amount', 'currency', 'category', 'category_display',
            'description', 'expense_date', 'status', 'status_display',
            'employee_name', 'created_at'
        ]


class ExpenseUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating expenses (only allows certain fields)
    """
    
    class Meta:
        model = Expense
        fields = [
            'amount', 'currency', 'category', 'description', 
            'expense_date', 'receipt'
        ]
    
    def validate(self, attrs):
        """Ensure expense can only be updated if it's pending"""
        instance = self.instance
        if instance and not instance.is_pending:
            raise serializers.ValidationError(
                "Only pending expenses can be updated."
            )
        return attrs


class ExpenseApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for managers/admins to approve or reject expenses
    """
    
    class Meta:
        model = Expense
        fields = ['status', 'approval_notes']
    
    def validate_status(self, value):
        """Validate status change"""
        if value not in [Expense.Status.APPROVED, Expense.Status.REJECTED]:
            raise serializers.ValidationError(
                "Status can only be changed to 'APPROVED' or 'REJECTED'."
            )
        return value
    
    def update(self, instance, validated_data):
        """Update expense with approval information"""
        request = self.context.get('request')
        if request and request.user:
            # Set approval information
            validated_data['approved_by'] = request.user
            from django.utils import timezone
            validated_data['approval_date'] = timezone.now()
        
        return super().update(instance, validated_data)


class ExpenseStatsSerializer(serializers.Serializer):
    """
    Serializer for expense statistics
    """
    total_expenses = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_count = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    rejected_count = serializers.IntegerField()
    pending_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    rejected_amount = serializers.DecimalField(max_digits=10, decimal_places=2)