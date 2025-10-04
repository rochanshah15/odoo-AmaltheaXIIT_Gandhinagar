// API configuration and utility functions for authentication
export const API_BASE_URL = 'http://127.0.0.1:8000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/login/`,
  REGISTER: `${API_BASE_URL}/auth/register/`,
  LOGOUT: `${API_BASE_URL}/auth/logout/`,
  TOKEN_REFRESH: `${API_BASE_URL}/auth/token/refresh/`,
  
  // User management
  USER_DETAIL: `${API_BASE_URL}/auth/user/`,
  USER_UPDATE: `${API_BASE_URL}/auth/user/update/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/user/change-password/`,
  
  // Admin endpoints
  USER_LIST: `${API_BASE_URL}/auth/users/`,
  COMPANY_STATS: `${API_BASE_URL}/auth/company/stats/`,
  
  // Admin panel endpoints
  ADMIN_USERS: `${API_BASE_URL}/admin/users/`,
  ADMIN_WORKFLOWS: `${API_BASE_URL}/admin/workflows/`,
  ADMIN_APPROVAL_RULES: `${API_BASE_URL}/admin/approval-rules/`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard/`,
  ADMIN_COMPANY: `${API_BASE_URL}/admin/company/`,
  
  // Test endpoint
  TEST_AUTH: `${API_BASE_URL}/auth/test/`,
};

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const removeTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// API request helper with automatic token handling
export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  // If token is expired, try to refresh
  if (response.status === 401 && token) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(API_ENDPOINTS.TOKEN_REFRESH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTokens(refreshData.access, refreshToken);
          
          // Retry original request with new token
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${refreshData.access}`,
          };
          
          response = await fetch(url, {
            ...config,
            headers: newHeaders,
          });
        } else {
          // Refresh failed, remove tokens and redirect to login
          removeTokens();
          window.location.href = '/login';
        }
      } catch (error) {
        removeTokens();
        window.location.href = '/login';
      }
    }
  }

  return response;
};

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.non_field_errors?.[0] || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens and user data
    setTokens(data.access, data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  },

  // Register user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    first_name?: string;
    last_name?: string;
    country?: string;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Handle different types of error responses
      if (errorData.username) {
        throw new Error(`Username: ${errorData.username[0]}`);
      }
      if (errorData.email) {
        throw new Error(`Email: ${errorData.email[0]}`);
      }
      if (errorData.password) {
        throw new Error(`Password: ${errorData.password[0]}`);
      }
      if (errorData.confirm_password) {
        throw new Error(`${errorData.confirm_password[0]}`);
      }
      throw new Error(errorData.detail || errorData.non_field_errors?.[0] || 'Registration failed');
    }

    const data = await response.json();
    
    // Don't store tokens since registration doesn't return them anymore
    // User needs to login after registration
    
    return data;
  },

  // Logout user
  logout: async () => {
    const refreshToken = getRefreshToken();
    
    try {
      await apiRequest(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error('Logout error:', error);
    } finally {
      removeTokens();
    }
  },

  // Get user details
  getUserDetails: async () => {
    const response = await apiRequest(API_ENDPOINTS.USER_DETAIL);
    
    if (!response.ok) {
      throw new Error('Failed to get user details');
    }
    
    return response.json();
  },

  // Update user information
  updateUser: async (userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    country?: string;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.USER_UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  },

  // Change password
  changePassword: async (passwordData: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }

    return response.json();
  },

  // Test authentication
  testAuth: async () => {
    const response = await apiRequest(API_ENDPOINTS.TEST_AUTH);
    
    if (!response.ok) {
      throw new Error('Authentication test failed');
    }
    
    return response.json();
  },
};

// Admin API functions
export const adminAPI = {
  // Get all users in company
  getUsers: async () => {
    const response = await apiRequest(API_ENDPOINTS.USER_LIST);
    
    if (!response.ok) {
      throw new Error('Failed to get users');
    }
    
    return response.json();
  },

  // Get company statistics
  getCompanyStats: async () => {
    const response = await apiRequest(API_ENDPOINTS.COMPANY_STATS);
    
    if (!response.ok) {
      throw new Error('Failed to get company stats');
    }
    
    return response.json();
  },

  // Update user (admin only)
  updateUserRole: async (userId: number, userData: {
    role?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    country?: string;
    manager?: number;
  }) => {
    const response = await apiRequest(`${API_ENDPOINTS.USER_LIST}${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  },

  // Delete user (admin only)
  deleteUser: async (userId: number) => {
    const response = await apiRequest(`${API_ENDPOINTS.USER_LIST}${userId}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  },
};

// Admin Panel API functions
export const adminPanelAPI = {
  // User Management
  getUsers: async () => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_USERS);
    if (!response.ok) {
      throw new Error('Failed to get users');
    }
    return response.json();
  },

  createUser: async (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    country?: string;
    manager_id?: number;
    password: string;
    password_confirm: string;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create user');
    }
    return response.json();
  },

  updateUser: async (userId: string, userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    country?: string;
    manager_id?: number;
    is_active_user?: boolean;
  }) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (userId: string) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}${userId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  },

  getManagers: async () => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}managers/`);
    if (!response.ok) {
      throw new Error('Failed to get managers');
    }
    return response.json();
  },

  // Approval Workflows
  getWorkflows: async () => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_WORKFLOWS);
    if (!response.ok) {
      throw new Error('Failed to get workflows');
    }
    return response.json();
  },

  createWorkflow: async (workflowData: {
    name: string;
    workflow_type: string;
    description?: string;
    is_active?: boolean;
    minimum_approval_percentage?: number;
    manager_approval_required?: boolean;
    approval_steps?: Array<{
      step_number: number;
      approver_role: string;
      approver?: string;
      is_required: boolean;
    }>;
    conditional_rules?: Array<{
      rule_type: string;
      percentage_threshold?: number;
      amount_threshold?: number;
      specific_approver?: string;
      condition_description?: string;
      is_active: boolean;
    }>;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_WORKFLOWS, {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create workflow');
    }
    return response.json();
  },

  updateWorkflow: async (workflowId: string, workflowData: any) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_WORKFLOWS}${workflowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(workflowData),
    });
    if (!response.ok) {
      throw new Error('Failed to update workflow');
    }
    return response.json();
  },

  deleteWorkflow: async (workflowId: string) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_WORKFLOWS}${workflowId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete workflow');
    }
  },

  // User Approval Rules
  getApprovalRules: async () => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_APPROVAL_RULES);
    if (!response.ok) {
      throw new Error('Failed to get approval rules');
    }
    return response.json();
  },

  createApprovalRule: async (ruleData: {
    user: string;
    workflow: string;
    description: string;
    is_active?: boolean;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_APPROVAL_RULES, {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create approval rule');
    }
    return response.json();
  },

  updateApprovalRule: async (ruleId: string, ruleData: any) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_APPROVAL_RULES}${ruleId}/`, {
      method: 'PATCH',
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      throw new Error('Failed to update approval rule');
    }
    return response.json();
  },

  deleteApprovalRule: async (ruleId: string) => {
    const response = await apiRequest(`${API_ENDPOINTS.ADMIN_APPROVAL_RULES}${ruleId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete approval rule');
    }
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_DASHBOARD);
    if (!response.ok) {
      throw new Error('Failed to get dashboard stats');
    }
    return response.json();
  },

  // Company
  getCompany: async () => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_COMPANY);
    if (!response.ok) {
      throw new Error('Failed to get company data');
    }
    return response.json();
  },

  updateCompany: async (companyData: {
    name?: string;
    default_currency?: string;
    country?: string;
  }) => {
    const response = await apiRequest(API_ENDPOINTS.ADMIN_COMPANY, {
      method: 'PATCH',
      body: JSON.stringify(companyData),
    });
    if (!response.ok) {
      throw new Error('Failed to update company');
    }
    return response.json();
  },
};