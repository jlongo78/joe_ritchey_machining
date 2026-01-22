import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Receipt,
  Calendar,
  Package,
  ShoppingCart,
  Truck,
  MessageSquare,
  FileEdit,
  UserCog,
  Clock,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: <Users size={20} /> },
      { label: 'Jobs', href: '/admin/jobs', icon: <Wrench size={20} /> },
      { label: 'Quotes', href: '/admin/quotes', icon: <FileText size={20} /> },
      { label: 'Invoices', href: '/admin/invoices', icon: <Receipt size={20} /> },
      { label: 'Schedule', href: '/admin/schedule', icon: <Calendar size={20} /> },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inventory', href: '/admin/inventory', icon: <Package size={20} /> },
      { label: 'Purchase Orders', href: '/admin/purchase-orders', icon: <ShoppingCart size={20} /> },
      { label: 'Suppliers', href: '/admin/suppliers', icon: <Truck size={20} /> },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/admin/messages', icon: <MessageSquare size={20} /> },
      { label: 'Templates', href: '/admin/templates', icon: <FileEdit size={20} /> },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Employees', href: '/admin/employees', icon: <UserCog size={20} /> },
      { label: 'Time Tracking', href: '/admin/time-tracking', icon: <Clock size={20} /> },
      { label: 'Equipment', href: '/admin/equipment', icon: <Gauge size={20} /> },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.map((s) => s.title)
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-admin-bg border-r border-admin-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-admin-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-electric-400 to-electric-600 flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">PRECISION</span>
              <span className="text-[10px] text-electric-400 tracking-wider">ENGINE & DYNO</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded bg-gradient-to-br from-electric-400 to-electric-600 flex items-center justify-center mx-auto">
            <Wrench size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-admin-bg-card border border-admin-border flex items-center justify-center text-chrome-400 hover:text-white hover:bg-admin-bg-hover transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4 px-2">
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-chrome-500 uppercase tracking-wider hover:text-chrome-300 transition-colors"
              >
                {section.title}
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform',
                    expandedSections.includes(section.title) ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </button>
            )}

            {(collapsed || expandedSections.includes(section.title)) && (
              <ul className="mt-1 space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.href && (
                      <NavLink
                        to={item.href}
                        className={({ isActive: navActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            collapsed && 'justify-center px-2',
                            isActive(item.href)
                              ? 'bg-electric-500/10 text-electric-400 border border-electric-500/20'
                              : 'text-chrome-400 hover:bg-admin-bg-hover hover:text-white'
                          )
                        }
                        title={collapsed ? item.label : undefined}
                      >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
