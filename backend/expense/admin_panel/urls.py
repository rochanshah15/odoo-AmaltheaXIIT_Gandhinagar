from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminCompanyViewSet, AdminUserManagementViewSet, AdminApprovalWorkflowViewSet,
    AdminExpenseManagementViewSet, AdminDashboardViewSet, AdminUserApprovalRuleViewSet
)

# Create router for admin viewsets
router = DefaultRouter()
router.register('company', AdminCompanyViewSet, basename='admin-company')
router.register('users', AdminUserManagementViewSet, basename='admin-users')
router.register('workflows', AdminApprovalWorkflowViewSet, basename='admin-workflows')
router.register('expenses', AdminExpenseManagementViewSet, basename='admin-expenses')
router.register('dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register('approval-rules', AdminUserApprovalRuleViewSet, basename='admin-approval-rules')

urlpatterns = [
    path('', include(router.urls)),
]