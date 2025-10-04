// API functions for manager operations
import { apiRequest, API_BASE_URL } from './api';
import { currencyService } from './currency';

export const MANAGER_API_ENDPOINTS = {
  // Manager dashboard
  PENDING_EXPENSES: `${API_BASE_URL}/manager/pending/`,
  PENDING_COUNT: `${API_BASE_URL}/manager/pending/count/`,
  DASHBOARD_STATS: `${API_BASE_URL}/manager/stats/`,
  
  // Team management  
  TEAM_MEMBERS: `${API_BASE_URL}/manager/team/`,
  TEAM_EXPENSES: `${API_BASE_URL}/manager/team/expenses/`,
  
  // Expense approval
  EXPENSE_DETAIL: (id: number) => `${API_BASE_URL}/manager/expenses/${id}/`,
  EXPENSE_APPROVAL: (id: number) => `${API_BASE_URL}/manager/expenses/${id}/approve/`,
  
  // Bulk operations
  BULK_APPROVE: `${API_BASE_URL}/manager/bulk/approve/`,
  BULK_REJECT: `${API_BASE_URL}/manager/bulk/reject/`,
};

export interface ManagerExpense {
  id: number;
  employee: number;
  employee_name: string;
  employee_username: string;
  amount: string;
  currency: string;
  category: string;
  category_display: string;
  description: string;
  expense_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status_display: string;
  receipt?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerExpenseDetail extends ManagerExpense {
  employee_email: string;
  approved_by?: number;
  approved_by_name?: string;
  approval_date?: string;
  approval_notes?: string;
}

export interface ManagerDashboardStats {
  pending_count: number;
  total_team_expenses: number;
  total_amount_pending: string;
  total_amount_approved_this_month: string;
  team_members_count: number;
}

export interface TeamMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  total_expenses: number;
  pending_expenses: number;
  date_joined: string;
}

export interface ExpenseApprovalAction {
  status: 'APPROVED' | 'REJECTED';
  approval_notes?: string;
}

// Utility function to add currency conversion to manager expenses
export const addCurrencyConversionToManagerExpenses = async (
  expenses: ManagerExpense[], 
  targetCurrency: string = 'USD'
): Promise<(ManagerExpense & { convertedAmount?: number; conversionRate?: number })[]> => {
  if (!expenses.length) return expenses;

  try {
    const conversionsPromise = expenses.map(async (expense) => {
      if (expense.currency === targetCurrency) {
        return { ...expense, convertedAmount: parseFloat(expense.amount), conversionRate: 1 };
      }

      try {
        const result = await currencyService.convertCurrency(
          parseFloat(expense.amount),
          expense.currency,
          targetCurrency
        );
        return {
          ...expense,
          convertedAmount: result.toAmount,
          conversionRate: result.rate
        };
      } catch (error) {
        console.warn(`Failed to convert ${expense.currency} to ${targetCurrency} for expense ${expense.id}`);
        return expense;
      }
    });

    return await Promise.all(conversionsPromise);
  } catch (error) {
    console.warn('Failed to add currency conversions to manager expenses:', error);
    return expenses;
  }
};

// Manager API functions
export const managerAPI = {
  // Get pending expenses for manager approval with optional currency conversion
  getPendingExpenses: async (convertToCurrency?: string): Promise<ManagerExpense[]> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.PENDING_EXPENSES);
    if (!response.ok) {
      throw new Error('Failed to fetch pending expenses');
    }
    
    const expenses = await response.json();
    
    // Add currency conversion if requested
    if (convertToCurrency) {
      return addCurrencyConversionToManagerExpenses(expenses, convertToCurrency);
    }
    
    return expenses;
  },

  // Get count of pending expenses (for notifications)
  getPendingCount: async (): Promise<{ pending_count: number }> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.PENDING_COUNT);
    if (!response.ok) {
      throw new Error('Failed to fetch pending count');
    }
    return response.json();
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<ManagerDashboardStats> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.DASHBOARD_STATS);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
  },

  // Get team members
  getTeamMembers: async (): Promise<TeamMember[]> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.TEAM_MEMBERS);
    if (!response.ok) {
      throw new Error('Failed to fetch team members');
    }
    return response.json();
  },

  // Get team expenses with filtering
  getTeamExpenses: async (filters?: {
    status?: string;
    employee?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ManagerExpenseDetail[]> => {
    let url = MANAGER_API_ENDPOINTS.TEAM_EXPENSES;
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await apiRequest(url);
    if (!response.ok) {
      throw new Error('Failed to fetch team expenses');
    }
    return response.json();
  },

  // Get expense detail for review
  getExpenseDetail: async (id: number): Promise<ManagerExpenseDetail> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.EXPENSE_DETAIL(id));
    if (!response.ok) {
      throw new Error('Failed to fetch expense detail');
    }
    return response.json();
  },

  // Approve or reject an expense
  approveExpense: async (id: number, action: ExpenseApprovalAction): Promise<ManagerExpenseDetail> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.EXPENSE_APPROVAL(id), {
      method: 'PATCH',
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process expense approval');
    }

    return response.json();
  },

  // Quick approve an expense (no notes)
  quickApprove: async (id: number): Promise<ManagerExpenseDetail> => {
    return managerAPI.approveExpense(id, { status: 'APPROVED' });
  },

  // Quick reject an expense (with automatic note)
  quickReject: async (id: number, reason?: string): Promise<ManagerExpenseDetail> => {
    return managerAPI.approveExpense(id, { 
      status: 'REJECTED',
      approval_notes: reason || 'Rejected by manager'
    });
  },

  // Bulk approve multiple expenses
  bulkApprove: async (expenseIds: number[], notes?: string): Promise<{ approved_count: number; message: string }> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.BULK_APPROVE, {
      method: 'PATCH',
      body: JSON.stringify({
        expense_ids: expenseIds,
        approval_notes: notes || ''
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to bulk approve expenses');
    }

    return response.json();
  },

  // Bulk reject multiple expenses
  bulkReject: async (expenseIds: number[], reason: string): Promise<{ rejected_count: number; message: string }> => {
    const response = await apiRequest(MANAGER_API_ENDPOINTS.BULK_REJECT, {
      method: 'PATCH',
      body: JSON.stringify({
        expense_ids: expenseIds,
        approval_notes: reason
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to bulk reject expenses');
    }

    return response.json();
  },
};