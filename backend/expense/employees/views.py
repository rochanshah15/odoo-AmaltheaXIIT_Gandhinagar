from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Expense
from .serializers import (
    ExpenseSerializer,
    ExpenseListSerializer,
    ExpenseUpdateSerializer,
    ExpenseApprovalSerializer,
    ExpenseStatsSerializer
)
from .permissions import (
    IsOwnerOrManagerOrAdmin,
    IsOwnerAndPending,
    IsManagerOrAdmin,
    IsEmployee
)

User = get_user_model()


class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    List all expenses for the authenticated user or create a new expense
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ExpenseSerializer
        return ExpenseListSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Employees can only see their own expenses
        if user.role == 'EMPLOYEE':
            return Expense.objects.filter(employee=user)
        
        # Managers can see expenses from their company
        elif user.role == 'MANAGER':
            return Expense.objects.filter(employee__company_id=user.company_id)
        
        # Admins can see all expenses
        elif user.role == 'ADMIN':
            return Expense.objects.all()
        
        # Default: return empty queryset
        return Expense.objects.none()
    
    def perform_create(self, serializer):
        # Automatically set the employee to the authenticated user
        serializer.save(employee=self.request.user)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific expense
    """
    queryset = Expense.objects.all()
    permission_classes = [IsOwnerAndPending]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ExpenseUpdateSerializer
        return ExpenseSerializer


class ExpenseApprovalView(generics.UpdateAPIView):
    """
    Approve or reject expenses (Manager/Admin only)
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseApprovalSerializer
    permission_classes = [IsManagerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can approve any expense
        if user.role == 'ADMIN':
            return Expense.objects.filter(status='PENDING')
        
        # Managers can approve expenses from their company
        elif user.role == 'MANAGER':
            return Expense.objects.filter(
                employee__company_id=user.company_id,
                status='PENDING'
            )
        
        return Expense.objects.none()


class MyExpenseStatsView(APIView):
    """
    Get expense statistics for the authenticated user
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's expenses
        if user.role == 'EMPLOYEE':
            expenses = Expense.objects.filter(employee=user)
        elif user.role == 'MANAGER':
            expenses = Expense.objects.filter(employee__company_id=user.company_id)
        elif user.role == 'ADMIN':
            expenses = Expense.objects.all()
        else:
            expenses = Expense.objects.none()
        
        # Calculate statistics
        stats = expenses.aggregate(
            total_expenses=Count('id'),
            total_amount=Sum('amount') or 0,
            pending_count=Count('id', filter=Q(status='PENDING')),
            approved_count=Count('id', filter=Q(status='APPROVED')),
            rejected_count=Count('id', filter=Q(status='REJECTED')),
            pending_amount=Sum('amount', filter=Q(status='PENDING')) or 0,
            approved_amount=Sum('amount', filter=Q(status='APPROVED')) or 0,
            rejected_amount=Sum('amount', filter=Q(status='REJECTED')) or 0,
        )
        
        serializer = ExpenseStatsSerializer(stats)
        return Response(serializer.data)


class RecentExpensesView(generics.ListAPIView):
    """
    Get recent expenses for the authenticated user
    """
    serializer_class = ExpenseListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get user's recent expenses (last 10)
        if user.role == 'EMPLOYEE':
            return Expense.objects.filter(employee=user)[:10]
        elif user.role == 'MANAGER':
            return Expense.objects.filter(employee__company_id=user.company_id)[:10]
        elif user.role == 'ADMIN':
            return Expense.objects.all()[:10]
        
        return Expense.objects.none()


class PendingExpensesView(generics.ListAPIView):
    """
    Get pending expenses for managers and admins to review
    """
    serializer_class = ExpenseListSerializer
    permission_classes = [IsManagerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all pending expenses
        if user.role == 'ADMIN':
            return Expense.objects.filter(status='PENDING')
        
        # Managers can see pending expenses from their company
        elif user.role == 'MANAGER':
            return Expense.objects.filter(
                employee__company_id=user.company_id,
                status='PENDING'
            )
        
        return Expense.objects.none()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_categories_view(request):
    """
    Get available expense categories
    """
    categories = [
        {'value': choice[0], 'label': choice[1]} 
        for choice in Expense.Category.choices
    ]
    return Response({'categories': categories})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_summary_view(request):
    """
    Get expense summary for dashboard
    """
    user = request.user
    
    # Get user's expenses based on role
    if user.role == 'EMPLOYEE':
        my_expenses = Expense.objects.filter(employee=user)
        company_expenses = None
    elif user.role == 'MANAGER':
        my_expenses = Expense.objects.filter(employee=user)
        company_expenses = Expense.objects.filter(employee__company_id=user.company_id)
    elif user.role == 'ADMIN':
        my_expenses = Expense.objects.filter(employee=user)
        company_expenses = Expense.objects.all()
    else:
        my_expenses = Expense.objects.none()
        company_expenses = None
    
    # Calculate my statistics
    my_stats = my_expenses.aggregate(
        total_count=Count('id'),
        total_amount=Sum('amount') or 0,
        pending_count=Count('id', filter=Q(status='PENDING')),
        approved_count=Count('id', filter=Q(status='APPROVED')),
        rejected_count=Count('id', filter=Q(status='REJECTED')),
    )
    
    # Calculate company statistics (for managers and admins)
    company_stats = None
    if company_expenses is not None:
        company_stats = company_expenses.aggregate(
            total_count=Count('id'),
            total_amount=Sum('amount') or 0,
            pending_count=Count('id', filter=Q(status='PENDING')),
            approved_count=Count('id', filter=Q(status='APPROVED')),
            rejected_count=Count('id', filter=Q(status='REJECTED')),
        )
    
    return Response({
        'my_expenses': my_stats,
        'company_expenses': company_stats,
        'user_role': user.role
    })
