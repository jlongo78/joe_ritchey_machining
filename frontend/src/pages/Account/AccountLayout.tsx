import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  User,
  Package,
  Wrench,
  FileText,
  CreditCard,
  Car,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-primary-50 text-primary-700 font-medium'
          : 'text-chrome-300 hover:bg-black hover:text-chrome-100'
      )
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const AccountLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/account" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card>
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-chrome-700">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-700">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-chrome-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-chrome-400">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <NavItem
                  to="/account"
                  icon={<User className="h-5 w-5" />}
                  label="Dashboard"
                />
                <NavItem
                  to="/account/orders"
                  icon={<Package className="h-5 w-5" />}
                  label="Parts Orders"
                />
                <NavItem
                  to="/account/service-requests"
                  icon={<FileText className="h-5 w-5" />}
                  label="Service Requests"
                />
                <NavItem
                  to="/account/jobs"
                  icon={<Wrench className="h-5 w-5" />}
                  label="Active Jobs"
                />
                <NavItem
                  to="/account/invoices"
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Invoices"
                />
                <NavItem
                  to="/account/vehicles"
                  icon={<Car className="h-5 w-5" />}
                  label="My Vehicles"
                />
                <NavItem
                  to="/account/settings"
                  icon={<Settings className="h-5 w-5" />}
                  label="Settings"
                />
              </nav>

              {/* Logout */}
              <div className="mt-6 pt-6 border-t border-chrome-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left text-chrome-300 hover:bg-black hover:text-chrome-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
