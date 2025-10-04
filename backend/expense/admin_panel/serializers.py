from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from employees.models import Expense
from .models import Company, ApprovalWorkflow, ApprovalStep, ConditionalRule, UserApprovalRule

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    """Serializer for Company model"""
    
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'default_currency', 'country', 
            'users_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        return obj.users.count()


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users by admin"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    manager_id = serializers.IntegerField(required=False, allow_null=True)
    full_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'country', 'manager_id', 'is_active_user',
            'password', 'password_confirm'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError("Passwords do not match")
        
        # Validate manager assignment
        if attrs.get('manager_id'):
            try:
                manager = User.objects.get(id=attrs['manager_id'])
                if manager.role not in ['ADMIN', 'MANAGER']:
                    raise serializers.ValidationError("Manager must have ADMIN or MANAGER role")
            except User.DoesNotExist:
                raise serializers.ValidationError("Manager does not exist")
        
        return attrs
    
    def validate_role(self, value):
        # Admin can create any role
        request_user = self.context['request'].user
        if request_user.role != 'ADMIN':
            raise serializers.ValidationError("Only admins can create users")
        return value
    
    def create(self, validated_data):
        # Remove password_confirm and extract custom fields
        validated_data.pop('password_confirm')
        manager_id = validated_data.pop('manager_id', None)
        full_name = validated_data.pop('full_name', '')
        
        # Handle full_name parsing
        if full_name and not validated_data.get('first_name'):
            name_parts = full_name.strip().split(' ', 1)
            validated_data['first_name'] = name_parts[0]
            if len(name_parts) > 1:
                validated_data['last_name'] = name_parts[1]
        
        # Set company from admin user
        admin_user = self.context['request'].user
        if admin_user.company:
            validated_data['company'] = admin_user.company
        
        # Create user
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Set manager if provided
        if manager_id:
            try:
                manager = User.objects.get(id=manager_id)
                user.manager = manager
                user.save()
            except User.DoesNotExist:
                pass
        
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for user management by admin"""
    
    full_name = serializers.CharField(source='get_full_name_display', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name_display', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    expenses_count = serializers.SerializerMethodField()
    pending_expenses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'country', 'company', 'company_name', 'manager', 'manager_name',
            'is_active_user', 'expenses_count', 'pending_expenses_count',
            'last_login', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']
    
    def get_expenses_count(self, obj):
        return obj.expenses.count()
    
    def get_pending_expenses_count(self, obj):
        return obj.expenses.filter(status='PENDING').count()


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users by admin"""
    
    manager_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'role', 'country',
            'manager_id', 'is_active_user'
        ]
    
    def validate_manager_id(self, value):
        if value:
            try:
                manager = User.objects.get(id=value)
                if manager.role not in ['ADMIN', 'MANAGER']:
                    raise serializers.ValidationError("Manager must have ADMIN or MANAGER role")
                return manager
            except User.DoesNotExist:
                raise serializers.ValidationError("Manager does not exist")
        return None
    
    def update(self, instance, validated_data):
        manager = validated_data.pop('manager_id', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update manager if provided
        if manager is not None:
            instance.manager = manager
        
        instance.save()
        return instance


class ApprovalStepSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalStep model"""
    
    approver_name = serializers.CharField(source='approver.get_full_name_display', read_only=True)
    
    class Meta:
        model = ApprovalStep
        fields = [
            'id', 'step_number', 'approver_role', 'approver', 'approver_name',
            'is_required', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConditionalRuleSerializer(serializers.ModelSerializer):
    """Serializer for ConditionalRule model"""
    
    specific_approver_name = serializers.CharField(source='specific_approver.get_full_name_display', read_only=True)
    
    class Meta:
        model = ConditionalRule
        fields = [
            'id', 'rule_type', 'percentage_threshold', 'specific_approver',
            'specific_approver_name', 'amount_threshold', 'condition_description',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalWorkflow model"""
    
    approval_steps = ApprovalStepSerializer(many=True, read_only=True)
    conditional_rules = ConditionalRuleSerializer(many=True, read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = ApprovalWorkflow
        fields = [
            'id', 'name', 'company', 'company_name', 'workflow_type', 'description',
            'is_active', 'minimum_approval_percentage', 'manager_approval_required',
            'approval_steps', 'conditional_rules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ApprovalWorkflowCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ApprovalWorkflow with nested steps/rules"""
    
    approval_steps = ApprovalStepSerializer(many=True, required=False)
    conditional_rules = ConditionalRuleSerializer(many=True, required=False)
    
    class Meta:
        model = ApprovalWorkflow
        fields = [
            'name', 'workflow_type', 'description', 'is_active',
            'minimum_approval_percentage', 'manager_approval_required',
            'approval_steps', 'conditional_rules'
        ]
    
    def validate(self, attrs):
        workflow_type = attrs.get('workflow_type')
        approval_steps = attrs.get('approval_steps', [])
        conditional_rules = attrs.get('conditional_rules', [])
        
        if workflow_type == 'SEQUENTIAL' and not approval_steps:
            raise serializers.ValidationError("Sequential workflows require approval steps")
        
        if workflow_type == 'CONDITIONAL' and not conditional_rules:
            raise serializers.ValidationError("Conditional workflows require conditional rules")
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        approval_steps_data = validated_data.pop('approval_steps', [])
        conditional_rules_data = validated_data.pop('conditional_rules', [])
        
        # Set company from admin user
        admin_user = self.context['request'].user
        if admin_user.company:
            validated_data['company'] = admin_user.company
        
        # Create workflow
        workflow = ApprovalWorkflow.objects.create(**validated_data)
        
        # Create approval steps
        for step_data in approval_steps_data:
            ApprovalStep.objects.create(workflow=workflow, **step_data)
        
        # Create conditional rules
        for rule_data in conditional_rules_data:
            ConditionalRule.objects.create(workflow=workflow, **rule_data)
        
        return workflow


class UserApprovalRuleSerializer(serializers.ModelSerializer):
    """Serializer for UserApprovalRule model"""
    
    user_name = serializers.CharField(source='user.get_full_name_display', read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    class Meta:
        model = UserApprovalRule
        fields = [
            'id', 'user', 'user_name', 'workflow', 'workflow_name',
            'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminExpenseSerializer(serializers.ModelSerializer):
    """Serializer for admin expense management"""
    
    employee_name = serializers.CharField(source='employee.get_full_name_display', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'employee', 'employee_name', 'employee_email', 'company', 'company_name',
            'amount', 'currency', 'category', 'category_display', 'description',
            'expense_date', 'status', 'status_display', 'receipt',
            'approved_by', 'approved_by_name', 'approval_date', 'approval_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'employee', 'company', 'approved_by', 'approval_date',
            'created_at', 'updated_at'
        ]


class AdminExpenseOverrideSerializer(serializers.Serializer):
    """Serializer for admin expense status override"""
    
    status = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_status(self, value):
        if value not in ['APPROVED', 'REJECTED']:
            raise serializers.ValidationError("Status must be either 'APPROVED' or 'REJECTED'")
        return value


class AdminDashboardStatsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    
    total_users = serializers.IntegerField()
    total_expenses = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_approvals = serializers.IntegerField()
    approved_this_month = serializers.IntegerField()
    company_name = serializers.CharField()
    
    # Breakdown by role
    admin_count = serializers.IntegerField()
    manager_count = serializers.IntegerField()
    employee_count = serializers.IntegerField()
    
    # Expense status breakdown
    pending_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    rejected_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for initial user registration (creates company)"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True)
    company_country = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'country',
            'password', 'password_confirm', 'company_name', 'company_country'
        ]
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError("Passwords do not match")
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract company data
        company_name = validated_data.pop('company_name')
        company_country = validated_data.pop('company_country', '')
        validated_data.pop('password_confirm')
        
        # Create company if this is the first signup
        if not Company.objects.exists():
            company = Company.objects.create(
                name=company_name,
                country=company_country
            )
            
            # Create admin user
            password = validated_data.pop('password')
            validated_data['role'] = 'ADMIN'
            validated_data['company'] = company
            
            user = User.objects.create_user(password=password, **validated_data)
            return user
        else:
            raise serializers.ValidationError("Company already exists. Please contact your administrator.")


class ManagerListSerializer(serializers.ModelSerializer):
    """Serializer for listing managers for assignment"""
    
    full_name = serializers.CharField(source='get_full_name_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email']