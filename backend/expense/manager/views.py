from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime
from decimal import Decimal

from authentication.permissions import IsManager, IsAdminOrManager
from employees.models import Expense
from authentication.models import User
from .serializers import (
    ExpenseApprovalActionSerializer,
    ManagerPendingExpenseSerializer,
    ManagerExpenseDetailSerializer,
    ManagerDashboardStatsSerializer,
    ManagerTeamMemberSerializer
)


class ManagerPendingExpensesView(generics.ListAPIView):
    """
    List all expenses awaiting manager approval from their direct reports
    """
    serializer_class = ManagerPendingExpenseSerializer
    permission_classes = [IsAuthenticated, IsManager]
    
    def get_queryset(self):
        """
        Filter expenses to show only pending ones from manager's direct reports
        """
        manager = self.request.user
        
        # Get all employees who report to this manager
        direct_reports = User.objects.filter(manager=manager)
        
        # Get pending expenses from these employees
        queryset = Expense.objects.filter(
            employee__in=direct_reports,
            status=Expense.Status.PENDING
        ).select_related('employee').order_by('-created_at')
        
        return queryset


class ManagerExpenseDetailView(generics.RetrieveAPIView):
    """
    Get detailed view of a specific expense for manager review
    """
    serializer_class = ManagerExpenseDetailSerializer
    permission_classes = [IsAuthenticated, IsManager]
    
    def get_queryset(self):
        """
        Only allow access to expenses from manager's direct reports
        """
        manager = self.request.user
        direct_reports = User.objects.filter(manager=manager)
        
        return Expense.objects.filter(
            employee__in=direct_reports
        ).select_related('employee', 'approved_by')


class ManagerExpenseApprovalView(generics.UpdateAPIView):
    """
    Approve or reject an expense - for managers only
    """
    serializer_class = ExpenseApprovalActionSerializer
    permission_classes = [IsAuthenticated, IsManager]
    
    def get_queryset(self):
        """
        Only allow access to pending expenses from manager's direct reports
        """
        manager = self.request.user
        direct_reports = User.objects.filter(manager=manager)
        
        return Expense.objects.filter(
            employee__in=direct_reports,
            status=Expense.Status.PENDING
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update expense status with approval/rejection
        """
        expense = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Update expense status
            expense.status = serializer.validated_data['status']
            expense.approval_notes = serializer.validated_data.get('approval_notes', '')
            expense.approved_by = request.user
            expense.approval_date = timezone.now()
            expense.save()
            
            # Return updated expense details
            response_serializer = ManagerExpenseDetailSerializer(expense)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManager])
def manager_pending_count(request):
    """
    Get count of pending expenses for the authenticated manager
    """
    manager = request.user
    direct_reports = User.objects.filter(manager=manager)
    
    pending_count = Expense.objects.filter(
        employee__in=direct_reports,
        status=Expense.Status.PENDING
    ).count()
    
    return Response({'pending_count': pending_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManager])
def manager_dashboard_stats(request):
    """
    Get comprehensive dashboard statistics for manager
    """
    manager = request.user
    direct_reports = User.objects.filter(manager=manager)
    
    # Get this month's date range
    now = timezone.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count pending expenses
    pending_count = Expense.objects.filter(
        employee__in=direct_reports,
        status=Expense.Status.PENDING
    ).count()
    
    # Total team expenses (all time)
    total_team_expenses = Expense.objects.filter(
        employee__in=direct_reports
    ).count()
    
    # Total amount pending approval
    pending_expenses = Expense.objects.filter(
        employee__in=direct_reports,
        status=Expense.Status.PENDING
    ).aggregate(total=Sum('amount'))
    total_amount_pending = pending_expenses['total'] or Decimal('0.00')
    
    # Total amount approved this month
    approved_this_month = Expense.objects.filter(
        employee__in=direct_reports,
        status=Expense.Status.APPROVED,
        approval_date__gte=current_month_start
    ).aggregate(total=Sum('amount'))
    total_amount_approved_this_month = approved_this_month['total'] or Decimal('0.00')
    
    # Team members count
    team_members_count = direct_reports.count()
    
    stats_data = {
        'pending_count': pending_count,
        'total_team_expenses': total_team_expenses,
        'total_amount_pending': total_amount_pending,
        'total_amount_approved_this_month': total_amount_approved_this_month,
        'team_members_count': team_members_count
    }
    
    serializer = ManagerDashboardStatsSerializer(stats_data)
    return Response(serializer.data)


class ManagerTeamMembersView(generics.ListAPIView):
    """
    List all team members (direct reports) for the manager
    """
    serializer_class = ManagerTeamMemberSerializer
    permission_classes = [IsAuthenticated, IsManager]
    
    def get_queryset(self):
        """
        Get all employees who report to this manager with expense statistics
        """
        manager = self.request.user
        
        queryset = User.objects.filter(
            manager=manager
        ).annotate(
            total_expenses=Count('expenses'),
            pending_expenses=Count('expenses', filter=Q(expenses__status=Expense.Status.PENDING))
        ).order_by('first_name', 'last_name')
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManager])
def manager_team_expenses(request):
    """
    Get all expenses from team members with filtering and pagination
    """
    manager = request.user
    direct_reports = User.objects.filter(manager=manager)
    
    # Get query parameters
    status_filter = request.GET.get('status', '')
    employee_filter = request.GET.get('employee', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    queryset = Expense.objects.filter(
        employee__in=direct_reports
    ).select_related('employee', 'approved_by')
    
    # Apply filters
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    if employee_filter:
        queryset = queryset.filter(employee__id=employee_filter)
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(expense_date__gte=date_from_obj)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(expense_date__lte=date_to_obj)
        except ValueError:
            pass
    
    # Order by most recent
    queryset = queryset.order_by('-created_at')
    
    # Serialize and return
    serializer = ManagerExpenseDetailSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsManager])
def manager_bulk_approve(request):
    """
    Bulk approve multiple expenses
    """
    manager = request.user
    expense_ids = request.data.get('expense_ids', [])
    approval_notes = request.data.get('approval_notes', '')
    
    if not expense_ids:
        return Response(
            {'error': 'No expense IDs provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get manager's direct reports
    direct_reports = User.objects.filter(manager=manager)
    
    # Filter expenses to only those from direct reports and pending
    expenses = Expense.objects.filter(
        id__in=expense_ids,
        employee__in=direct_reports,
        status=Expense.Status.PENDING
    )
    
    # Update all expenses
    updated_count = expenses.update(
        status=Expense.Status.APPROVED,
        approved_by=manager,
        approval_date=timezone.now(),
        approval_notes=approval_notes
    )
    
    return Response({
        'message': f'Successfully approved {updated_count} expenses',
        'approved_count': updated_count
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsManager])  
def manager_bulk_reject(request):
    """
    Bulk reject multiple expenses
    """
    manager = request.user
    expense_ids = request.data.get('expense_ids', [])
    approval_notes = request.data.get('approval_notes', '')
    
    if not expense_ids:
        return Response(
            {'error': 'No expense IDs provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not approval_notes:
        return Response(
            {'error': 'Rejection reason is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get manager's direct reports
    direct_reports = User.objects.filter(manager=manager)
    
    # Filter expenses to only those from direct reports and pending
    expenses = Expense.objects.filter(
        id__in=expense_ids,
        employee__in=direct_reports,
        status=Expense.Status.PENDING
    )
    
    # Update all expenses
    updated_count = expenses.update(
        status=Expense.Status.REJECTED,
        approved_by=manager,
        approval_date=timezone.now(),
        approval_notes=approval_notes
    )
    
    return Response({
        'message': f'Successfully rejected {updated_count} expenses',
        'rejected_count': updated_count
    })
