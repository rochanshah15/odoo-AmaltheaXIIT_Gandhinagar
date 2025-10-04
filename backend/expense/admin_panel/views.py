from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from decimal import Decimal

from employees.models import Expense
from .models import Company, ApprovalWorkflow, ApprovalStep, ConditionalRule, UserApprovalRule
from .serializers import (
    CompanySerializer, AdminUserSerializer, AdminUserCreateSerializer, AdminUserUpdateSerializer,
    ApprovalWorkflowSerializer, ApprovalWorkflowCreateSerializer, ApprovalStepSerializer,
    ConditionalRuleSerializer, UserApprovalRuleSerializer, AdminExpenseSerializer,
    AdminExpenseOverrideSerializer, AdminDashboardStatsSerializer, ManagerListSerializer
)
from .permissions import IsAdmin, IsAdminUser, IsSameCompany

User = get_user_model()


class AdminCompanyViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for company management"""
    
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    
    def get_queryset(self):
        # Admin can only manage their own company
        return Company.objects.filter(id=self.request.user.company.id)
    
    def perform_update(self, serializer):
        # Only allow updating current user's company
        if serializer.instance.id != self.request.user.company.id:
            raise PermissionError("Cannot update other companies")
        serializer.save()


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for user management"""
    
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    
    def get_queryset(self):
        # Admin can only manage users in their company
        return User.objects.filter(company=self.request.user.company).select_related(
            'company', 'manager'
        ).prefetch_related('expenses')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return AdminUserSerializer
    
    def perform_create(self, serializer):
        # User will be created with admin's company
        serializer.save()
    
    def perform_update(self, serializer):
        # Ensure user belongs to admin's company
        if serializer.instance.company != self.request.user.company:
            raise PermissionError("Cannot update users from other companies")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Prevent deleting users from other companies or self-deletion
        if instance.company != self.request.user.company:
            raise PermissionError("Cannot delete users from other companies")
        if instance == self.request.user:
            raise PermissionError("Cannot delete yourself")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def managers(self, request):
        """Get list of managers for assignment"""
        managers = self.get_queryset().filter(
            role__in=['ADMIN', 'MANAGER']
        ).exclude(id=request.user.id)
        
        serializer = ManagerListSerializer(managers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user"""
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'Cannot deactivate yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active_user = False
        user.save()
        
        return Response({
            'message': f'User {user.get_full_name_display()} deactivated successfully'
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user"""
        user = self.get_object()
        user.is_active_user = True
        user.save()
        
        return Response({
            'message': f'User {user.get_full_name_display()} activated successfully'
        })
    
    @action(detail=True, methods=['get'])
    def expenses(self, request, pk=None):
        """Get expenses for a specific user"""
        user = self.get_object()
        expenses = user.expenses.all().order_by('-created_at')
        
        serializer = AdminExpenseSerializer(expenses, many=True)
        return Response(serializer.data)


class AdminApprovalWorkflowViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for approval workflow management"""
    
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    
    def get_queryset(self):
        return ApprovalWorkflow.objects.filter(
            company=self.request.user.company
        ).prefetch_related('approval_steps', 'conditional_rules')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ApprovalWorkflowCreateSerializer
        return ApprovalWorkflowSerializer
    
    def perform_create(self, serializer):
        # Workflow will be created for admin's company
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an approval workflow"""
        workflow = self.get_object()
        workflow.is_active = True
        workflow.save()
        
        return Response({
            'message': f'Workflow "{workflow.name}" activated successfully'
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an approval workflow"""
        workflow = self.get_object()
        workflow.is_active = False
        workflow.save()
        
        return Response({
            'message': f'Workflow "{workflow.name}" deactivated successfully'
        })
    
    @action(detail=True, methods=['post'])
    def add_step(self, request, pk=None):
        """Add an approval step to workflow"""
        workflow = self.get_object()
        
        serializer = ApprovalStepSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workflow=workflow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_rule(self, request, pk=None):
        """Add a conditional rule to workflow"""
        workflow = self.get_object()
        
        serializer = ConditionalRuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workflow=workflow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminExpenseManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin viewset for expense management and oversight"""
    
    serializer_class = AdminExpenseSerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    
    def get_queryset(self):
        return Expense.objects.filter(
            company=self.request.user.company
        ).select_related('employee', 'company', 'approved_by').order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get expense statistics for admin dashboard"""
        queryset = self.get_queryset()
        
        # Basic stats
        total_expenses = queryset.count()
        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        
        # Status breakdown
        pending_count = queryset.filter(status='PENDING').count()
        approved_count = queryset.filter(status='APPROVED').count()
        rejected_count = queryset.filter(status='REJECTED').count()
        
        # Amount breakdown by status
        pending_amount = queryset.filter(status='PENDING').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        approved_amount = queryset.filter(status='APPROVED').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        rejected_amount = queryset.filter(status='REJECTED').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        
        # Monthly stats
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        approved_this_month = queryset.filter(
            status='APPROVED',
            approval_date__gte=current_month
        ).count()
        
        return Response({
            'total_expenses': total_expenses,
            'total_amount': total_amount,
            'pending_count': pending_count,
            'approved_count': approved_count,
            'rejected_count': rejected_count,
            'pending_amount': pending_amount,
            'approved_amount': approved_amount,
            'rejected_amount': rejected_amount,
            'approved_this_month': approved_this_month,
        })
    
    @action(detail=True, methods=['post'])
    def override_status(self, request, pk=None):
        """Admin override for expense status"""
        expense = self.get_object()
        
        serializer = AdminExpenseOverrideSerializer(data=request.data)
        if serializer.is_valid():
            status_value = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            
            expense.status = status_value
            expense.approved_by = request.user
            expense.approval_date = timezone.now()
            expense.approval_notes = f"Admin Override: {notes}" if notes else "Admin Override"
            expense.save()
            
            return Response({
                'message': f'Expense {status_value.lower()} by admin override',
                'expense': AdminExpenseSerializer(expense).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Bulk approve multiple expenses"""
        expense_ids = request.data.get('expense_ids', [])
        notes = request.data.get('notes', 'Bulk approved by admin')
        
        if not expense_ids:
            return Response(
                {'error': 'No expense IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expenses = self.get_queryset().filter(
            id__in=expense_ids,
            status='PENDING'
        )
        
        updated_count = expenses.update(
            status='APPROVED',
            approved_by=request.user,
            approval_date=timezone.now(),
            approval_notes=notes
        )
        
        return Response({
            'message': f'{updated_count} expenses approved successfully'
        })
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """Bulk reject multiple expenses"""
        expense_ids = request.data.get('expense_ids', [])
        notes = request.data.get('notes', 'Bulk rejected by admin')
        
        if not expense_ids:
            return Response(
                {'error': 'No expense IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expenses = self.get_queryset().filter(
            id__in=expense_ids,
            status='PENDING'
        )
        
        updated_count = expenses.update(
            status='REJECTED',
            approved_by=request.user,
            approval_date=timezone.now(),
            approval_notes=notes
        )
        
        return Response({
            'message': f'{updated_count} expenses rejected successfully'
        })


class AdminDashboardViewSet(viewsets.ViewSet):
    """Admin dashboard with comprehensive statistics"""
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def list(self, request):
        """Get comprehensive admin dashboard statistics"""
        company = request.user.company
        
        # User statistics
        total_users = User.objects.filter(company=company).count()
        admin_count = User.objects.filter(company=company, role='ADMIN').count()
        manager_count = User.objects.filter(company=company, role='MANAGER').count()
        employee_count = User.objects.filter(company=company, role='EMPLOYEE').count()
        
        # Expense statistics
        expenses = Expense.objects.filter(company=company)
        total_expenses = expenses.count()
        total_amount = expenses.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        
        # Pending approvals
        pending_approvals = expenses.filter(status='PENDING').count()
        
        # Monthly approved expenses
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        approved_this_month = expenses.filter(
            status='APPROVED',
            approval_date__gte=current_month
        ).count()
        
        # Amount breakdown by status
        pending_amount = expenses.filter(status='PENDING').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        approved_amount = expenses.filter(status='APPROVED').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        rejected_amount = expenses.filter(status='REJECTED').aggregate(
            Sum('amount'))['amount__sum'] or Decimal('0')
        
        stats_data = {
            'total_users': total_users,
            'total_expenses': total_expenses,
            'total_amount': total_amount,
            'pending_approvals': pending_approvals,
            'approved_this_month': approved_this_month,
            'company_name': company.name if company else 'No Company',
            'admin_count': admin_count,
            'manager_count': manager_count,
            'employee_count': employee_count,
            'pending_amount': pending_amount,
            'approved_amount': approved_amount,
            'rejected_amount': rejected_amount,
        }
        
        serializer = AdminDashboardStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get recent activities for dashboard"""
        company = request.user.company
        
        # Recent expenses (last 10)
        recent_expenses = Expense.objects.filter(
            company=company
        ).select_related('employee', 'approved_by').order_by('-created_at')[:10]
        
        # Recent user registrations (last 5)
        week_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(
            company=company,
            date_joined__gte=week_ago
        ).order_by('-date_joined')[:5]
        
        # Pending high-value expenses (>$1000)
        high_value_pending = Expense.objects.filter(
            company=company,
            status='PENDING',
            amount__gt=1000
        ).select_related('employee').order_by('-amount')[:5]
        
        return Response({
            'recent_expenses': AdminExpenseSerializer(recent_expenses, many=True).data,
            'recent_users': AdminUserSerializer(recent_users, many=True).data,
            'high_value_pending': AdminExpenseSerializer(high_value_pending, many=True).data,
        })
    
    @action(detail=False, methods=['get'])
    def monthly_trends(self, request):
        """Get monthly expense trends for charts"""
        company = request.user.company
        
        # Get last 12 months data
        months_data = []
        current_date = timezone.now()
        
        for i in range(12):
            month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if month_start.month == 1:
                month_end = month_start.replace(month=2) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
            
            month_expenses = Expense.objects.filter(
                company=company,
                created_at__gte=month_start,
                created_at__lte=month_end.replace(hour=23, minute=59, second=59)
            )
            
            months_data.append({
                'month': month_start.strftime('%Y-%m'),
                'month_name': month_start.strftime('%B %Y'),
                'total_expenses': month_expenses.count(),
                'total_amount': month_expenses.aggregate(Sum('amount'))['amount__sum'] or 0,
                'approved_count': month_expenses.filter(status='APPROVED').count(),
                'rejected_count': month_expenses.filter(status='REJECTED').count(),
                'pending_count': month_expenses.filter(status='PENDING').count(),
            })
            
            # Move to previous month
            if current_date.month == 1:
                current_date = current_date.replace(year=current_date.year - 1, month=12)
            else:
                current_date = current_date.replace(month=current_date.month - 1)
        
        return Response({
            'months_data': list(reversed(months_data))
        })


class AdminUserApprovalRuleViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing user-specific approval rules"""
    
    serializer_class = UserApprovalRuleSerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    
    def get_queryset(self):
        return UserApprovalRule.objects.filter(
            user__company=self.request.user.company
        ).select_related('user', 'workflow')
    
    def perform_create(self, serializer):
        # Ensure user belongs to admin's company
        user = serializer.validated_data['user']
        if user.company != self.request.user.company:
            raise PermissionError("Cannot create rules for users from other companies")
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Get approval rules grouped by user"""
        user_id = request.query_params.get('user_id')
        if user_id:
            rules = self.get_queryset().filter(user_id=user_id)
        else:
            rules = self.get_queryset()
        
        serializer = self.get_serializer(rules, many=True)
        return Response(serializer.data)
