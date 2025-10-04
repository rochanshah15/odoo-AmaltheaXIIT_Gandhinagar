import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WorkflowStepper, WorkflowStep } from '@/components/WorkflowStepper';
import { toast } from 'sonner';
import { managerAPI, ManagerExpense, ManagerExpenseDetail } from '@/lib/manager-api';
import { CurrencySelect, CurrencyDisplay, CurrencyConverter } from '@/components/ui/currency-converter';

const ManagerDashboard = () => {
  const [selectedExpense, setSelectedExpense] = useState<ManagerExpenseDetail | null>(null);
  const [comment, setComment] = useState('');
  const [pendingExpenses, setPendingExpenses] = useState<ManagerExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState('USD'); // For currency conversion display

  // Fetch pending expenses on component mount
  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    try {
      setLoading(true);
      const expenses = await managerAPI.getPendingExpenses();
      setPendingExpenses(expenses);
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
      toast.error('Failed to load pending expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;
    
    try {
      setActionLoading(true);
      await managerAPI.approveExpense(selectedExpense.id, {
        status: 'APPROVED',
        approval_notes: comment
      });
      
      toast.success('Expense approved successfully!');
      setSelectedExpense(null);
      setComment('');
      fetchPendingExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense) return;
    
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setActionLoading(true);
      await managerAPI.approveExpense(selectedExpense.id, {
        status: 'REJECTED',
        approval_notes: comment
      });
      
      toast.success('Expense rejected');
      setSelectedExpense(null);
      setComment('');
      fetchPendingExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickApprove = async (expenseId: number) => {
    try {
      await managerAPI.quickApprove(expenseId);
      toast.success('Expense approved successfully!');
      fetchPendingExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  const handleQuickReject = async (expenseId: number) => {
    try {
      await managerAPI.quickReject(expenseId, 'Quick rejection by manager');
      toast.success('Expense rejected');
      fetchPendingExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    }
  };

  const handleReviewExpense = async (expense: ManagerExpense) => {
    try {
      const detailedExpense = await managerAPI.getExpenseDetail(expense.id);
      setSelectedExpense(detailedExpense);
      setComment(detailedExpense.approval_notes || '');
    } catch (error) {
      console.error('Error fetching expense details:', error);
      toast.error('Failed to load expense details');
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return <CurrencyDisplay amount={parseFloat(amount)} currency={currency} />;
  };

  const workflowSteps: WorkflowStep[] = [
    { id: '1', name: 'Manager', status: 'current' },
    { id: '2', name: 'Finance', status: 'pending' },
    { id: '3', name: 'Final Approval', status: 'pending' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
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
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-muted-foreground mt-1">Review and approve expense requests</p>
          </div>
          <div className="flex flex-col items-end">
            <Label className="text-xs text-muted-foreground mb-1">View amounts in:</Label>
            <CurrencySelect
              value={baseCurrency}
              onValueChange={setBaseCurrency}
              className="w-24"
            />
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
            <CardTitle>Pending Approvals ({pendingExpenses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingExpenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending expenses to review</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Employee</TableHead>
                      <TableHead className="min-w-[180px]">Description</TableHead>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{expense.employee_name}</TableCell>
                        <TableCell className="max-w-[180px] truncate" title={expense.description}>
                          {expense.description}
                        </TableCell>
                        <TableCell>{expense.expense_date}</TableCell>
                        <TableCell>{expense.category_display}</TableCell>
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
                          <Badge variant="secondary" className="bg-pending/10 text-pending">
                            {expense.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleQuickApprove(expense.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleQuickReject(expense.id)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewExpense(expense)}
                            >
                              Review
                            </Button>
                          </div>
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

      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Expense Request</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this expense
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-6">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Employee</Label>
                    <p className="font-medium">{selectedExpense.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedExpense.expense_date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedExpense.category_display}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <div className="flex flex-col gap-1">
                      <CurrencyDisplay amount={parseFloat(selectedExpense.amount)} currency={selectedExpense.currency} className="font-medium text-lg" />
                      {selectedExpense.currency !== baseCurrency && (
                        <CurrencyConverter
                          defaultAmount={parseFloat(selectedExpense.amount)}
                          defaultFromCurrency={selectedExpense.currency}
                          defaultToCurrency={baseCurrency}
                          compact={true}
                          className="text-sm text-muted-foreground"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedExpense.description}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Approval Workflow</Label>
                <WorkflowStepper steps={workflowSteps} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comments (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add any notes or feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedExpense(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;
