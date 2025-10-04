from django.urls import path
from . import views

app_name = 'employees'

urlpatterns = [
    # Expense CRUD operations
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense_list_create'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),
    
    # Expense approval (for managers/admins)
    path('expenses/<int:pk>/approve/', views.ExpenseApprovalView.as_view(), name='expense_approval'),
    
    # Statistics and summary views
    path('expenses/stats/', views.MyExpenseStatsView.as_view(), name='expense_stats'),
    path('expenses/recent/', views.RecentExpensesView.as_view(), name='recent_expenses'),
    path('expenses/pending/', views.PendingExpensesView.as_view(), name='pending_expenses'),
    path('expenses/summary/', views.expense_summary_view, name='expense_summary'),
    
    # Utility endpoints
    path('categories/', views.expense_categories_view, name='expense_categories'),
]