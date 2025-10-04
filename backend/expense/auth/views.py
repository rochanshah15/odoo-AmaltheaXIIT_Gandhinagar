from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer
)
from .permissions import IsAdminOrSelf, IsAdmin

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns JWT tokens with user information
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    Public endpoint for user registration
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        Create a new user and return tokens along with user info
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            user = serializer.save()
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Add custom claims to access token
            access_token['username'] = user.username
            access_token['email'] = user.email
            access_token['role'] = user.role
            access_token['company_id'] = user.company_id
            
            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'company_id': user.company_id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'country': user.country,
                },
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveAPIView):
    """
    Protected endpoint to get authenticated user details
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """
    Protected endpoint to update user information
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """
    Protected endpoint to change user password
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Change password
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """
    Admin-only endpoint to list all users in the company
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        # Admin can see all users in their company
        return User.objects.filter(
            company_id=self.request.user.company_id
        ).order_by('date_joined')


class UserManagementView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin-only endpoint to manage specific users
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        # Admin can manage users in their company
        return User.objects.filter(
            company_id=self.request.user.company_id
        )
    
    def update(self, request, *args, **kwargs):
        """Allow admin to update user role and other fields"""
        instance = self.get_object()
        
        # Prevent admin from removing their own admin role
        if (instance == request.user and 
            'role' in request.data and 
            request.data['role'] != 'ADMIN'):
            return Response({
                'error': 'You cannot remove your own admin role'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update allowed fields
        allowed_fields = ['role', 'first_name', 'last_name', 'email', 'country', 'manager']
        for field in allowed_fields:
            if field in request.data:
                setattr(instance, field, request.data[field])
        
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint to blacklist the refresh token
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_auth_view(request):
    """
    Test endpoint to verify authentication is working
    """
    return Response({
        'message': 'Authentication is working!',
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'company_id': request.user.company_id,
        }
    })


class CompanyStatsView(APIView):
    """
    Admin endpoint to get company statistics
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        company_id = request.user.company_id
        
        total_users = User.objects.filter(company_id=company_id).count()
        admins = User.objects.filter(company_id=company_id, role='ADMIN').count()
        managers = User.objects.filter(company_id=company_id, role='MANAGER').count()
        employees = User.objects.filter(company_id=company_id, role='EMPLOYEE').count()
        
        return Response({
            'company_id': company_id,
            'total_users': total_users,
            'role_distribution': {
                'admins': admins,
                'managers': managers,
                'employees': employees,
            }
        })
