import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Clock, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Country {
  name: {
    common: string;
    official: string;
  };
  currencies: Record<string, {
    name: string;
    symbol: string;
  }>;
}

const AdminDashboard = () => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const data = await response.json();
        
        // Sort countries alphabetically by common name
        const sortedCountries = data.sort((a: Country, b: Country) => 
          a.name.common.localeCompare(b.name.common)
        );
        
        setCountries(sortedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast.error('Failed to load countries. Please refresh the page.');
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const stats = [
    { title: 'Total Expenses', value: '$45,231', icon: DollarSign, color: 'text-primary' },
    { title: 'Pending Approvals', value: '12', icon: Clock, color: 'text-pending' },
    { title: 'Approved This Month', value: '87', icon: CheckCircle, color: 'text-approved' },
    { title: 'Total Users', value: '24', icon: Users, color: 'text-primary' },
  ];

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }
    
    toast.success('User added successfully!');
    setOpenAddUser(false);
    setSelectedCountry('');
    setSelectedRole('');
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your organization's expenses</p>
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
                  <Label htmlFor="userCountry">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry} required disabled={countriesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={countriesLoading ? "Loading countries..." : "Select country"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {countries.map((country) => (
                        <SelectItem key={country.name.common} value={country.name.common}>
                          {country.name.common}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <SelectItem value="manager1">Sarah Johnson</SelectItem>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Activity feed will be displayed here
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
