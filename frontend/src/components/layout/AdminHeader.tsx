import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  Plus,
} from 'lucide-react';

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

interface QuickAction {
  label: string;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { label: 'New Customer', href: '/admin/customers/new', color: 'bg-green-500' },
  { label: 'New Job', href: '/admin/jobs/new', color: 'bg-blue-500' },
  { label: 'New Quote', href: '/admin/quotes/new', color: 'bg-purple-500' },
  { label: 'New Invoice', href: '/admin/invoices/new', color: 'bg-amber-500' },
];

const AdminHeader: React.FC<AdminHeaderProps> = ({ sidebarCollapsed, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Mock notifications for now
  const notifications = [
    { id: 1, title: 'New service request', message: 'John Doe submitted a request', time: '5m ago', unread: true },
    { id: 2, title: 'Invoice overdue', message: 'INV-2024-0045 is past due', time: '1h ago', unread: true },
    { id: 3, title: 'Job completed', message: 'JOB-2024-0123 marked complete', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-admin-bg-secondary border-b border-admin-border transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:block">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers, jobs, invoices..."
                className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div ref={quickActionsRef} className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-3 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-48 bg-admin-bg-card border border-admin-border rounded-lg shadow-xl py-1 z-50">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-chrome-300 hover:bg-admin-bg-hover hover:text-white transition-colors"
                    onClick={() => setShowQuickActions(false)}
                  >
                    <div className={cn('w-2 h-2 rounded-full', action.color)} />
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-admin-bg-card border border-admin-border rounded-lg shadow-xl z-50">
                <div className="px-4 py-3 border-b border-admin-border">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'px-4 py-3 hover:bg-admin-bg-hover transition-colors cursor-pointer border-l-2',
                        notification.unread ? 'border-electric-500 bg-electric-500/5' : 'border-transparent'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        <span className="text-xs text-chrome-500">{notification.time}</span>
                      </div>
                      <p className="text-xs text-chrome-400 mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-admin-border">
                  <Link
                    to="/admin/notifications"
                    className="text-sm text-electric-400 hover:text-electric-300 transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-electric-500/20 border border-electric-500/30 flex items-center justify-center">
                <User size={16} className="text-electric-400" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-chrome-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-admin-bg-card border border-admin-border rounded-lg shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-admin-border md:hidden">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-chrome-500 capitalize">{user?.role}</p>
                </div>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-chrome-300 hover:bg-admin-bg-hover hover:text-white transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-admin-bg-hover transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
