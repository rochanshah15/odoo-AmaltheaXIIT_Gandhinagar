import { useState } from 'react';
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

interface Expense {
  id: string;
  employeeName: string;
  approvalSubject: string;
  date: string;
  amount: string;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    employeeName: 'Alice Williams',
    approvalSubject: 'Conference Travel Expenses',
    date: '2025-10-01',
    amount: '$450.00',
    category: 'Travel',
    description: 'Flight to conference',
    status: 'pending',
  },
  {
    id: '2',
    employeeName: 'Bob Smith',
    approvalSubject: 'Client Entertainment',
    date: '2025-10-02',
    amount: '$120.50',
    category: 'Meals',
    description: 'Client dinner',
    status: 'pending',
  },
  {
    id: '3',
    employeeName: 'Carol Johnson',
    approvalSubject: 'Equipment Purchase',
    date: '2025-10-03',
    amount: '$89.99',
    category: 'Office Supplies',
    description: 'Laptop accessories',
    status: 'pending',
  },
];

const workflowSteps: WorkflowStep[] = [
  { id: '1', name: 'Manager', status: 'current' },
  { id: '2', name: 'Finance', status: 'pending' },
  { id: '3', name: 'Final Approval', status: 'pending' },
];

const ManagerDashboard = () => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [comment, setComment] = useState('');

  const handleApprove = () => {
    toast.success('Expense approved successfully!');
    setSelectedExpense(null);
    setComment('');
  };

  const handleReject = () => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    toast.success('Expense rejected');
    setSelectedExpense(null);
    setComment('');
  };

  const handleQuickApprove = (expenseId: string) => {
    toast.success('Expense approved successfully!');
  };

  const handleQuickReject = (expenseId: string) => {
    toast.error('Expense rejected');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and approve expense requests</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Employee</TableHead>
                    <TableHead className="min-w-[180px]">Approval Subject</TableHead>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{expense.employeeName}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={expense.approvalSubject}>
                        {expense.approvalSubject}
                      </TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">{expense.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-pending/10 text-pending">
                          Pending
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
                            onClick={() => setSelectedExpense(expense)}
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
                    <p className="font-medium">{selectedExpense.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedExpense.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-medium text-lg">{selectedExpense.amount}</p>
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
                <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={handleApprove}>
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
