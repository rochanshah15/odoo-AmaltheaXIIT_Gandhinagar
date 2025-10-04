import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CheckCircle,
  ClipboardList,
  Shield,
  LogOut,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
}

const adminItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard/admin', icon: LayoutDashboard },
  { title: 'User Management', url: '/dashboard/admin/users', icon: Users },
  { title: 'Approval Rules', url: '/dashboard/admin/approval-rules', icon: Shield },
  { title: 'Expense Management', url: '/dashboard/admin/expenses', icon: FileText },
  { title: 'Settings', url: '/dashboard/admin/settings', icon: Settings },
];

const managerItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard/manager', icon: LayoutDashboard },
];

const employeeItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard/employee', icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, logout } = useAuth();

  const items =
    user?.role === 'ADMIN'
      ? adminItems
      : user?.role === 'MANAGER'
      ? managerItems
      : employeeItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'}>
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={state === 'collapsed' ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== 'collapsed' && (
                        <span className="flex items-center justify-between flex-1">
                          {item.title}
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Logout Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {state !== 'collapsed' && (
                    <span>Logout</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
