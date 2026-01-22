import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  UserCog,
  Wrench,
  User,
  Mail,
  Phone,
  Edit,
  Key,
  Ban,
  CheckCircle,
} from 'lucide-react';
import type { User as UserType } from '@/types';

interface AdminUser extends UserType {
  lastLogin?: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield size={16} className="text-red-400" />,
  manager: <UserCog size={16} className="text-amber-400" />,
  technician: <Wrench size={16} className="text-electric-400" />,
  customer: <User size={16} className="text-chrome-400" />,
};

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  technician: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
  customer: 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20',
};

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockUsers: AdminUser[] = [
        {
          id: 1,
          email: 'admin@precision-engine.com',
          firstName: 'Joe',
          lastName: 'Ritchey',
          phone: '(555) 100-0001',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2024-01-22',
          lastLogin: '2024-01-22T08:30:00Z',
        },
        {
          id: 2,
          email: 'mike@precision-engine.com',
          firstName: 'Mike',
          lastName: 'Thompson',
          phone: '(555) 100-0002',
          role: 'manager',
          isActive: true,
          emailVerified: true,
          createdAt: '2023-03-15',
          updatedAt: '2024-01-20',
          lastLogin: '2024-01-21T16:45:00Z',
        },
        {
          id: 3,
          email: 'steve@precision-engine.com',
          firstName: 'Steve',
          lastName: 'Martinez',
          phone: '(555) 100-0003',
          role: 'technician',
          isActive: true,
          emailVerified: true,
          createdAt: '2023-06-01',
          updatedAt: '2024-01-18',
          lastLogin: '2024-01-22T07:00:00Z',
        },
        {
          id: 4,
          email: 'dave@precision-engine.com',
          firstName: 'Dave',
          lastName: 'Wilson',
          phone: '(555) 100-0004',
          role: 'technician',
          isActive: true,
          emailVerified: true,
          createdAt: '2023-08-15',
          updatedAt: '2024-01-15',
          lastLogin: '2024-01-22T06:45:00Z',
        },
        {
          id: 5,
          email: 'tom@precision-engine.com',
          firstName: 'Tom',
          lastName: 'Anderson',
          phone: '(555) 100-0005',
          role: 'technician',
          isActive: false,
          emailVerified: true,
          createdAt: '2023-04-01',
          updatedAt: '2024-01-10',
          lastLogin: '2024-01-05T14:30:00Z',
        },
      ];

      let filtered = mockUsers;
      if (filterRole !== 'all') {
        filtered = filtered.filter((u) => u.role === filterRole);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
      }

      setUsers(filtered);
      setIsLoading(false);
    };

    loadUsers();
  }, [searchQuery, filterRole]);

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-chrome-400 mt-1">Manage team members and access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white focus:outline-none focus:border-electric-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="technician">Technician</option>
        </select>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-12 text-center text-chrome-400">
          No users found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                'bg-admin-bg-card border border-admin-border rounded-xl p-5 hover:border-admin-border-light transition-colors',
                !user.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-admin-bg flex items-center justify-center border border-admin-border">
                    {roleIcons[user.role]}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border capitalize',
                        roleBadgeColors[user.role]
                      )}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-admin-bg-card border border-admin-border rounded-lg shadow-xl py-1 z-10 hidden group-hover:block">
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-chrome-300 hover:bg-admin-bg-hover hover:text-white">
                      <Edit size={14} />
                      Edit User
                    </button>
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-chrome-300 hover:bg-admin-bg-hover hover:text-white">
                      <Key size={14} />
                      Reset Password
                    </button>
                    <button
                      className={cn(
                        'flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-admin-bg-hover',
                        user.isActive ? 'text-red-400' : 'text-green-400'
                      )}
                    >
                      {user.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-chrome-400">
                  <Mail size={14} />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-chrome-400">
                    <Phone size={14} />
                    {user.phone}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-admin-border flex items-center justify-between">
                <span className="text-xs text-chrome-500">
                  Last login: {formatLastLogin(user.lastLogin)}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    user.isActive ? 'text-green-400' : 'text-chrome-500'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', user.isActive ? 'bg-green-400' : 'bg-chrome-500')} />
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserListPage;
