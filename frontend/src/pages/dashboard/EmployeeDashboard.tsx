import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { expenseAPI, type Expense, type ExpenseCreate, type Category } from '@/lib/expense-api';
import { CurrencySelect, CurrencyDisplay, CurrencyConverter } from '@/components/ui/currency-converter';
import { currencyService } from '@/lib/currency';

const EmployeeDashboard = () => {
  const [openSubmit, setOpenSubmit] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    // Default categories as fallback
    { value: 'TRAVEL', label: 'Travel' },
    { value: 'MEALS', label: 'Meals & Entertainment' },
    { value: 'OFFICE', label: 'Office Supplies' },
    { value: 'TRANSPORT', label: 'Transportation' },
    { value: 'ACCOMMODATION', label: 'Accommodation' },
    { value: 'OTHER', label: 'Other' },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('USD'); // For currency conversion display
  
  // Form state
  const [formData, setFormData] = useState<ExpenseCreate>({
    amount: 0,
    currency: 'USD',
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });
  const [receipt, setReceipt] = useState<File | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, categoriesData] = await Promise.all([
        expenseAPI.getExpenses(),
        expenseAPI.getCategories(),
      ]);
      
      setExpenses(expensesData);
      // Only update categories if we get data from API
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
      }
      console.log('Categories loaded:', categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load expense data');
      // Keep default categories on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseCreate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // If amount or currency changes, update the currency conversion
    if (field === 'amount' || field === 'currency') {
      updateConversion(
        field === 'amount' ? Number(value) : formData.amount,
        field === 'currency' ? String(value) : formData.currency
      );
    }
  };

  const updateConversion = async (amount: number, fromCurrency: string) => {
    if (amount <= 0 || !fromCurrency || fromCurrency === baseCurrency) {
      setConvertedAmount(null);
      return;
    }

    try {
      setConversionLoading(true);
      const converted = await currencyService.convertCurrency(amount, fromCurrency, baseCurrency);
      setConvertedAmount(converted.toAmount);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      setConvertedAmount(null);
    } finally {
      setConversionLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      currency: 'USD',
      category: '',
      description: '',
      expense_date: '',
    });
    setReceipt(null);
    setConvertedAmount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.expense_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const expenseData: ExpenseCreate = {
        ...formData,
        ...(receipt && { receipt }),
      };

      await expenseAPI.createExpense(expenseData);
      
      toast.success('Expense submitted successfully!');
      setOpenSubmit(false);
      resetForm();
      
      // Reload expenses to show the new one
      await loadData();
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      toast.error(error.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return '';
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    // Use the CurrencyDisplay component's formatting logic
    return <CurrencyDisplay amount={parseFloat(amount)} currency={currency} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Dashboard</h1>
            <p className="text-muted-foreground mt-1">Submit and track your expenses</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Base Currency Selector */}
            <div className="flex flex-col items-end">
              <Label className="text-xs text-muted-foreground mb-1">View amounts in:</Label>
              <CurrencySelect
                value={baseCurrency}
                onValueChange={setBaseCurrency}
                className="w-24"
              />
            </div>
            <Dialog open={openSubmit} onOpenChange={setOpenSubmit}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>Submit New Expense</DialogTitle>
                <DialogDescription>
                  Fill in the details of your expense claim
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={formData.amount || ''} 
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <CurrencySelect
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    />
                  </div>
                </div>

                {/* Currency Conversion Display */}
                {convertedAmount !== null && formData.currency !== baseCurrency && (
                  <div className="bg-muted/50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Converted to {baseCurrency}:
                      </span>
                      <div className="flex items-center gap-2">
                        {conversionLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CurrencyDisplay amount={convertedAmount} currency={baseCurrency} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleInputChange('category', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.expense_date}
                      onChange={(e) => handleInputChange('expense_date', e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about this expense..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="receipt" 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {receipt && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {receipt.name}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setOpenSubmit(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Expense'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>My Expense History ({expenses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No expenses found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your first expense using the button above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Approval Notes</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="max-w-[200px]">
                          <div>
                            <p className="font-medium truncate" title={expense.description}>
                              {expense.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {expense.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(expense.expense_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expense.category_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="flex flex-col items-end gap-1">
                            <CurrencyDisplay amount={parseFloat(expense.amount)} currency={expense.currency} />
                            {expense.currency !== baseCurrency && (
                              <CurrencyConverter
                                defaultAmount={parseFloat(expense.amount)}
                                defaultFromCurrency={expense.currency}
                                defaultToCurrency={baseCurrency}
                                compact={true}
                                className="text-xs text-muted-foreground"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusVariant(expense.status)} 
                            className={getStatusColor(expense.status)}
                          >
                            {expense.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          {expense.approval_notes ? (
                            <div>
                              <p className="text-sm truncate" title={expense.approval_notes}>
                                {expense.approval_notes}
                              </p>
                              {expense.approved_by_name && (
                                <p className="text-xs text-muted-foreground">
                                  by {expense.approved_by_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboard;
