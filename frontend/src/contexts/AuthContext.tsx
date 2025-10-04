import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, removeTokens } from '@/lib/api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  company_id: string;
  country?: string;
  manager?: number;
  date_joined: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (
    username: string,
    email: string, 
    password: string, 
    confirmPassword: string,
    firstName?: string,
    lastName?: string,
    country?: string
  ) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  testLogin: (role: UserRole) => void; // Keep for testing purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        
        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          
          // Verify token is still valid by testing authentication
          try {
            await authAPI.testAuth();
            setUser(userData);
          } catch (error) {
            // Token is invalid, clear stored data
            removeTokens();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      setUser(response.user);
      
      // Navigate to appropriate dashboard based on role
      const role = response.user.role.toLowerCase();
      setTimeout(() => {
        window.location.href = `/dashboard/${role}`;
      }, 100);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    firstName?: string,
    lastName?: string,
    country?: string
  ) => {
    try {
      setLoading(true);
      const response = await authAPI.register({
        username,
        email,
        password,
        confirm_password: confirmPassword,
        first_name: firstName || '',
        last_name: lastName || '',
        country: country || '',
      });
      
      // Don't set user automatically since we're not auto-logging in
      // User will need to login after signup
      
      return response;
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Keep test login for development/testing
  const testLogin = (role: UserRole) => {
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000),
      username: `test_${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@test.com`,
      first_name: 'Test',
      last_name: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
      role,
      company_id: 'test-company',
      date_joined: new Date().toISOString(),
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        isAuthenticated: !!user,
        loading,
        testLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
