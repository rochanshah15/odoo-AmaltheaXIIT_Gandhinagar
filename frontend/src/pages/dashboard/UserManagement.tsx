import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'inactive';
  manager?: string;
  lastLogin: string;
}

const UserManagement = () => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const users: User[] = [
    {
      id: '1',
      name: 'Marc Johnson',
      email: 'marc@company.com',
      role: 'employee',
      status: 'active',
      manager: 'Sarah Wilson',
      lastLogin: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-01-15'
    },
    {
      id: '3',
      name: 'John Smith',
      email: 'john@company.com',
      role: 'employee',
      status: 'active',
      manager: 'Sarah Wilson',
      lastLogin: '2024-01-14'
    },
    {
      id: '4',
      name: 'Mitchell Brown',
      email: 'mitchell@company.com',
      role: 'employee',
      status: 'inactive',
      manager: 'Sarah Wilson',
      lastLogin: '2024-01-10'
    },
    {
      id: '5',
      name: 'Andreas Lee',
      email: 'andreas@company.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15'
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('User added successfully!');
    setOpenAddUser(false);
  };

  const handleEditUser = (userId: string) => {
    toast.info(`Edit user ${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    toast.error(`Delete user ${userId}`);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'employee':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
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
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage organization users and their roles</p>
          </div>
          <Dialog open={openAddUser} onOpenChange={setOpenAddUser}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new employee or manager account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <Input id="userName" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" type="email" placeholder="john@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPassword">Password</Label>
                  <Input id="userPassword" type="password" placeholder="Minimum 8 characters" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedRole === 'employee' && (
                  <div className="space-y-2">
                    <Label htmlFor="assignManager">Assign Manager</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager1">Sarah Wilson</SelectItem>
                        <SelectItem value="manager2">Michael Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpenAddUser(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add User</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.manager || '-'}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserManagement;
