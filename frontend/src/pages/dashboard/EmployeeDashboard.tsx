import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload } from 'lucide-react';
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

interface Expense {
  id: string;
  empName: string;
  description: string;
  date: string;
  category: string;
  paidBy: string;
  remarks: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockExpenses: Expense[] = [
  { 
    id: '1', 
    empName: 'John Smith', 
    description: 'Client meeting travel expenses', 
    date: '2025-09-28', 
    category: 'Travel', 
    paidBy: 'Company Card', 
    remarks: 'Approved by manager', 
    amount: '$320.00', 
    status: 'approved' 
  },
  { 
    id: '2', 
    empName: 'Sarah Johnson', 
    description: 'Team lunch meeting', 
    date: '2025-09-25', 
    category: 'Meals', 
    paidBy: 'Personal Card', 
    remarks: 'Pending review', 
    amount: '$75.50', 
    status: 'pending' 
  },
  { 
    id: '3', 
    empName: 'Mike Wilson', 
    description: 'Office stationery purchase', 
    date: '2025-09-20', 
    category: 'Office Supplies', 
    paidBy: 'Cash', 
    remarks: 'Receipt not provided', 
    amount: '$45.99', 
    status: 'rejected' 
  },
  { 
    id: '4', 
    empName: 'Lisa Brown', 
    description: 'Software subscription', 
    date: '2025-09-18', 
    category: 'Equipment', 
    paidBy: 'Company Card', 
    remarks: '—', 
    amount: '$120.00', 
    status: 'pending' 
  },
  { 
    id: '5', 
    empName: 'David Lee', 
    description: 'Conference registration', 
    date: '2025-09-15', 
    category: 'Travel', 
    paidBy: 'Personal Card', 
    remarks: '—', 
    amount: '$250.00', 
    status: 'approved' 
  },
];

const EmployeeDashboard = () => {
  const [openSubmit, setOpenSubmit] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Expense submitted successfully!');
    setOpenSubmit(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
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
    switch (status) {
      case 'approved':
        return 'bg-approved/10 text-approved';
      case 'pending':
        return 'bg-pending/10 text-pending';
      case 'rejected':
        return 'bg-rejected/10 text-rejected';
      default:
        return '';
    }
  };

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
          <Dialog open={openSubmit} onOpenChange={setOpenSubmit}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit New Expense</DialogTitle>
                <DialogDescription>
                  Fill in the details of your expense claim
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="office">Office Supplies</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about this expense..."
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidBy">Paid By</Label>
                  <Input
                    id="paidBy"
                    placeholder="Enter name of person who paid"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Add any additional comments or notes..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt</Label>
                  <div className="flex items-center gap-2">
                    <Input id="receipt" type="file" accept="image/*,.pdf" />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpenSubmit(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[100px]">Paid By</TableHead>
                    <TableHead className="min-w-[150px]">Remarks</TableHead>
                    <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.empName}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={expense.description}>
                        {expense.description}
                      </TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.paidBy}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={expense.remarks}>
                        {expense.remarks}
                      </TableCell>
                      <TableCell className="text-right font-medium">{expense.amount}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(expense.status)} className={getStatusColor(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboard;
