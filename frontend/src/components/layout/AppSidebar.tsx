import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CheckCircle,
  ClipboardList,
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
  { title: 'All Expenses', url: '/dashboard/admin/expenses', icon: FileText },
  { title: 'Settings', url: '/dashboard/admin/settings', icon: Settings },
];

const managerItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard/manager', icon: LayoutDashboard },
  { title: 'Approvals', url: '/dashboard/manager/approvals', icon: CheckCircle, badge: 5 },
  { title: 'My Expenses', url: '/dashboard/manager/expenses', icon: FileText },
];

const employeeItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard/employee', icon: LayoutDashboard },
  { title: 'My Expenses', url: '/dashboard/employee/expenses', icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();

  const items =
    user?.role === 'admin'
      ? adminItems
      : user?.role === 'manager'
      ? managerItems
      : employeeItems;

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
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
      </SidebarContent>
    </Sidebar>
  );
}
