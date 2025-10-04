// API functions for expense management
import { apiRequest, API_BASE_URL } from './api';
import { currencyService } from './currency';

export const EXPENSE_API_ENDPOINTS = {
  // Expense CRUD
  EXPENSES: `${API_BASE_URL}/expenses/`,
  EXPENSE_DETAIL: (id: number) => `${API_BASE_URL}/expenses/${id}/`,
  EXPENSE_APPROVAL: (id: number) => `${API_BASE_URL}/expenses/${id}/approve/`,
  
  // Statistics and summaries
  EXPENSE_STATS: `${API_BASE_URL}/expenses/stats/`,
  RECENT_EXPENSES: `${API_BASE_URL}/expenses/recent/`,
  PENDING_EXPENSES: `${API_BASE_URL}/expenses/pending/`,
  EXPENSE_SUMMARY: `${API_BASE_URL}/expenses/summary/`,
  
  // Utility
  CATEGORIES: `${API_BASE_URL}/categories/`,
};

export interface Expense {
  id: number;
  amount: string;
  currency: string;
  category: string;
  category_display: string;
  description: string;
  expense_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status_display: string;
  receipt?: string;
  employee: number;
  employee_name: string;
  employee_username: string;
  approved_by?: number;
  approved_by_name?: string;
  approval_date?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  amount: number;
  currency: string;
  category: string;
  description: string;
  expense_date: string;
  receipt?: File;
}

export interface ExpenseUpdate {
  amount?: number;
  currency?: string;
  category?: string;
  description?: string;
  expense_date?: string;
  receipt?: File;
}

export interface ExpenseStats {
  total_expenses: number;
  total_amount: string;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  pending_amount: string;
  approved_amount: string;
  rejected_amount: string;
}

export interface ExpenseSummary {
  my_expenses: {
    total_count: number;
    total_amount: string;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
  };
  company_expenses?: {
    total_count: number;
    total_amount: string;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
  };
  user_role: string;
}

export interface Category {
  value: string;
  label: string;
}

// Utility function to add currency conversion to expenses
export const addCurrencyConversion = async (
  expenses: Expense[], 
  targetCurrency: string = 'USD'
): Promise<(Expense & { convertedAmount?: number; conversionRate?: number })[]> => {
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
    console.warn('Failed to add currency conversions to expenses:', error);
    return expenses;
  }
};

// Expense API functions
export const expenseAPI = {
  // Get all expenses for current user with optional currency conversion
  getExpenses: async (convertToCurrency?: string): Promise<Expense[]> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSES);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    
    const expenses = await response.json();
    
    // Add currency conversion if requested
    if (convertToCurrency) {
      return addCurrencyConversion(expenses, convertToCurrency);
    }
    
    return expenses;
  },

  // Create a new expense
  createExpense: async (expenseData: ExpenseCreate): Promise<Expense> => {
    const formData = new FormData();
    
    formData.append('amount', expenseData.amount.toString());
    formData.append('currency', expenseData.currency);
    formData.append('category', expenseData.category);
    formData.append('description', expenseData.description);
    formData.append('expense_date', expenseData.expense_date);
    
    if (expenseData.receipt) {
      formData.append('receipt', expenseData.receipt);
    }

    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSES, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header, let browser set it for FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create expense');
    }

    return response.json();
  },

  // Get a specific expense
  getExpense: async (id: number): Promise<Expense> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_DETAIL(id));
    if (!response.ok) {
      throw new Error('Failed to fetch expense');
    }
    return response.json();
  },

  // Update an expense
  updateExpense: async (id: number, expenseData: ExpenseUpdate): Promise<Expense> => {
    const formData = new FormData();
    
    if (expenseData.amount !== undefined) {
      formData.append('amount', expenseData.amount.toString());
    }
    if (expenseData.currency) {
      formData.append('currency', expenseData.currency);
    }
    if (expenseData.category) {
      formData.append('category', expenseData.category);
    }
    if (expenseData.description) {
      formData.append('description', expenseData.description);
    }
    if (expenseData.expense_date) {
      formData.append('expense_date', expenseData.expense_date);
    }
    if (expenseData.receipt) {
      formData.append('receipt', expenseData.receipt);
    }

    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_DETAIL(id), {
      method: 'PATCH',
      body: formData,
      headers: {
        // Don't set Content-Type header, let browser set it for FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update expense');
    }

    return response.json();
  },

  // Delete an expense
  deleteExpense: async (id: number): Promise<void> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_DETAIL(id), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  },

  // Approve or reject an expense (manager/admin only)
  approveExpense: async (id: number, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<Expense> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_APPROVAL(id), {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        approval_notes: notes || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to approve expense');
    }

    return response.json();
  },

  // Get expense statistics
  getExpenseStats: async (): Promise<ExpenseStats> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_STATS);
    if (!response.ok) {
      throw new Error('Failed to fetch expense statistics');
    }
    return response.json();
  },

  // Get recent expenses
  getRecentExpenses: async (): Promise<Expense[]> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.RECENT_EXPENSES);
    if (!response.ok) {
      throw new Error('Failed to fetch recent expenses');
    }
    return response.json();
  },

  // Get pending expenses (manager/admin only)
  getPendingExpenses: async (): Promise<Expense[]> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.PENDING_EXPENSES);
    if (!response.ok) {
      throw new Error('Failed to fetch pending expenses');
    }
    return response.json();
  },

  // Get expense summary for dashboard with optional currency conversion
  getExpenseSummary: async (convertToCurrency?: string): Promise<ExpenseSummary> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.EXPENSE_SUMMARY);
    if (!response.ok) {
      throw new Error('Failed to fetch expense summary');
    }
    
    const summary = await response.json();
    
    // Note: Summary amounts are already aggregated, so conversion would need to be done on the backend
    // For now, we'll return the summary as-is and let the frontend handle display conversion
    return summary;
  },

  // Get available categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiRequest(EXPENSE_API_ENDPOINTS.CATEGORIES);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data.categories;
  },
};