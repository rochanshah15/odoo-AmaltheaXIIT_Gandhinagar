from django.urls import path
from . import views

urlpatterns = [
    # Pending expenses for manager
    path('pending/', views.ManagerPendingExpensesView.as_view(), name='manager-pending-expenses'),
    
    # Pending count for notifications
    path('pending/count/', views.manager_pending_count, name='manager-pending-count'),
    
    # Dashboard statistics
    path('stats/', views.manager_dashboard_stats, name='manager-dashboard-stats'),
    
    # Team members
    path('team/', views.ManagerTeamMembersView.as_view(), name='manager-team-members'),
    
    # Team expenses with filtering
    path('team/expenses/', views.manager_team_expenses, name='manager-team-expenses'),
    
    # Expense detail view
    path('expenses/<int:pk>/', views.ManagerExpenseDetailView.as_view(), name='manager-expense-detail'),
    
    # Approve/reject specific expense
    path('expenses/<int:pk>/approve/', views.ManagerExpenseApprovalView.as_view(), name='manager-expense-approval'),
    
    # Bulk operations
    path('bulk/approve/', views.manager_bulk_approve, name='manager-bulk-approve'),
    path('bulk/reject/', views.manager_bulk_reject, name='manager-bulk-reject'),
]