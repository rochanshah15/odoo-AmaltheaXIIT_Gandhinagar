import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Approver {
  id: string;
  name: string;
  required: boolean;
}

const ApprovalRules = () => {
  const [selectedUser, setSelectedUser] = useState('marc');
  const [description, setDescription] = useState('Approval rule for miscellaneous expenses');
  const [selectedManager, setSelectedManager] = useState('sarah');
  const [isManagerApprover, setIsManagerApprover] = useState(false);
  const [approversSequence, setApproversSequence] = useState(false);
  const [minimumApprovalPercentage, setMinimumApprovalPercentage] = useState('50');
  const [approvers, setApprovers] = useState<Approver[]>([
    { id: '1', name: 'John', required: false },
    { id: '2', name: 'Mitchell', required: false },
    { id: '3', name: 'Andreas', required: false },
  ]);

  const handleApproverRequiredChange = (approverId: string, required: boolean) => {
    setApprovers(prev => 
      prev.map(approver => 
        approver.id === approverId 
          ? { ...approver, required }
          : approver
      )
    );
  };

  const handleAddApprover = () => {
    const newApprover: Approver = {
      id: Date.now().toString(),
      name: '',
      required: false,
    };
    setApprovers(prev => [...prev, newApprover]);
  };

  const handleRemoveApprover = (approverId: string) => {
    setApprovers(prev => prev.filter(approver => approver.id !== approverId));
  };

  const handleApproverNameChange = (approverId: string, name: string) => {
    setApprovers(prev => 
      prev.map(approver => 
        approver.id === approverId 
          ? { ...approver, name }
          : approver
      )
    );
  };

  const handleSave = () => {
    toast.success('Approval rules saved successfully!');
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Approval Rules</h1>
              <p className="text-muted-foreground mt-1">Configure approval workflows for expense requests</p>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Save Rules
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section: Rule Configuration Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Rule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Field */}
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marc">Marc Johnson</SelectItem>
                      <SelectItem value="sarah">Sarah Wilson</SelectItem>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="mitchell">Mitchell Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description about rules</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description for the approval rule"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Manager Field */}
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Wilson</SelectItem>
                      <SelectItem value="michael">Michael Chen</SelectItem>
                      <SelectItem value="lisa">Lisa Anderson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Section: Approvers & Sequence Configuration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Approvers & Sequence Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Is Manager an Approver Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isManagerApprover"
                      checked={isManagerApprover}
                      onCheckedChange={(checked) => setIsManagerApprover(checked as boolean)}
                    />
                    <Label htmlFor="isManagerApprover" className="text-sm font-medium">
                      Is manager an approver?
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>If this field is checked then by default the approve request would go to his/her manager first, before going to other approvers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Approvers Sequence Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="approversSequence"
                      checked={approversSequence}
                      onCheckedChange={(checked) => setApproversSequence(checked as boolean)}
                    />
                    <Label htmlFor="approversSequence" className="text-sm font-medium">
                      Approvers Sequence
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>If this field is ticked true then the above mentioned sequence of approvers matters, that is first the request goes to John, if he approves/rejects then only request goes to Mitchell and so on. If the required approver rejects the request, then expense request is auto-rejected. If not ticked then send approver request to all approvers at the same time.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Minimum Approval Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="minimumApproval">Minimum Approval percentage</Label>
                  <div className="relative">
                    <Input
                      id="minimumApproval"
                      type="number"
                      min="0"
                      max="100"
                      value={minimumApprovalPercentage}
                      onChange={(e) => setMinimumApprovalPercentage(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Specify the number of percentage approvers required in order to get the request approved.
                  </p>
                </div>

                {/* Approvers List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Approvers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddApprover}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Approver
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {approvers.map((approver, index) => (
                      <div key={approver.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter approver name"
                            value={approver.name}
                            onChange={(e) => handleApproverNameChange(approver.id, e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${approver.id}`}
                              checked={approver.required}
                              onCheckedChange={(checked) => handleApproverRequiredChange(approver.id, checked as boolean)}
                            />
                            <Label htmlFor={`required-${approver.id}`} className="text-sm">
                              Required
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>If this field is ticked true then the above mentioned sequence of approvers matters, that is first the request goes to John, if he approves/rejects then only request goes to Mitchell and so on.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveApprover(approver.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ApprovalRules;
