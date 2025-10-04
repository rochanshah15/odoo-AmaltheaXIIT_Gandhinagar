from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'auth'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management endpoints
    path('user/', views.UserDetailView.as_view(), name='user_detail'),
    path('user/update/', views.UserUpdateView.as_view(), name='user_update'),
    path('user/change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    
    # Admin endpoints
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserManagementView.as_view(), name='user_management'),
    path('company/stats/', views.CompanyStatsView.as_view(), name='company_stats'),
    
    # Test endpoint
    path('test/', views.test_auth_view, name='test_auth'),
]