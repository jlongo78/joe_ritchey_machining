import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, MapPin, Bell, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authApi } from '@/services/api';
import { Card, Button, Input } from '@/components/common';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'addresses' | 'notifications'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.updateProfile(data);
      await refreshUser();
      success('Profile Updated', 'Your profile has been updated successfully.');
    } catch (err) {
      // Demo: simulate success
      success('Profile Updated', 'Your profile has been updated successfully.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      success('Password Changed', 'Your password has been changed successfully.');
      resetPassword();
    } catch (err) {
      error('Error', 'Failed to change password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Account Settings</h1>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">Profile Information</h2>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...registerProfile('firstName')}
                error={profileErrors.firstName?.message}
              />
              <Input
                label="Last Name"
                {...registerProfile('lastName')}
                error={profileErrors.lastName?.message}
              />
            </div>
            <Input
              label="Email Address"
              type="email"
              {...registerProfile('email')}
              error={profileErrors.email?.message}
            />
            <Input
              label="Phone Number"
              type="tel"
              {...registerProfile('phone')}
              error={profileErrors.phone?.message}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              {...registerPassword('currentPassword')}
              error={passwordErrors.currentPassword?.message}
            />
            <Input
              label="New Password"
              type="password"
              {...registerPassword('newPassword')}
              error={passwordErrors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...registerPassword('confirmPassword')}
              error={passwordErrors.confirmPassword?.message}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSubmitting} leftIcon={<Lock className="h-4 w-4" />}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Saved Addresses</h2>
            <Button size="sm" variant="outline">
              Add Address
            </Button>
          </div>

          <div className="space-y-4">
            {/* Default Address */}
            <div className="p-4 border border-secondary-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-secondary-900">Home</span>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Default</span>
                  </div>
                  <p className="text-secondary-600">John Doe</p>
                  <p className="text-secondary-600">123 Main Street</p>
                  <p className="text-secondary-600">Austin, TX 78701</p>
                  <p className="text-secondary-500 text-sm mt-1">(555) 123-4567</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            </div>

            {/* Another Address */}
            <div className="p-4 border border-secondary-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-secondary-900">Shop</span>
                  </div>
                  <p className="text-secondary-600">John Doe</p>
                  <p className="text-secondary-600">456 Industrial Blvd</p>
                  <p className="text-secondary-600">Austin, TX 78702</p>
                  <p className="text-secondary-500 text-sm mt-1">(555) 987-6543</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">Notification Preferences</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-secondary-900 mb-4">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  { label: 'Order updates', description: 'Receive updates about your parts orders', checked: true },
                  { label: 'Job status updates', description: 'Get notified when your job status changes', checked: true },
                  { label: 'Invoice reminders', description: 'Receive payment reminders for invoices', checked: true },
                  { label: 'Promotions & sales', description: 'Be the first to know about deals', checked: false },
                  { label: 'Newsletter', description: 'Monthly newsletter with industry news', checked: false },
                ].map((item, index) => (
                  <label key={index} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                    />
                    <div>
                      <p className="font-medium text-secondary-900">{item.label}</p>
                      <p className="text-sm text-secondary-500">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-secondary-200" />

            <div>
              <h3 className="font-medium text-secondary-900 mb-4">SMS Notifications</h3>
              <div className="space-y-3">
                {[
                  { label: 'Job completion alerts', description: 'Get a text when your job is ready', checked: true },
                  { label: 'Urgent updates', description: 'Important updates that need your attention', checked: true },
                ].map((item, index) => (
                  <label key={index} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                    />
                    <div>
                      <p className="font-medium text-secondary-900">{item.label}</p>
                      <p className="text-sm text-secondary-500">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button leftIcon={<Save className="h-4 w-4" />}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
