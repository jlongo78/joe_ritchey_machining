import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  Building2,
  Bell,
  Mail,
  CreditCard,
  FileText,
  Palette,
  Save,
} from 'lucide-react';

type SettingsTab = 'business' | 'notifications' | 'email' | 'payment' | 'templates' | 'branding';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [isSaving, setIsSaving] = useState(false);

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'business', label: 'Business Info', icon: <Building2 size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { key: 'email', label: 'Email Settings', icon: <Mail size={18} /> },
    { key: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { key: 'templates', label: 'Templates', icon: <FileText size={18} /> },
    { key: 'branding', label: 'Branding', icon: <Palette size={18} /> },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-chrome-400 mt-1">Configure your business settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 disabled:bg-electric-500/50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Navigation */}
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === tab.key
                    ? 'bg-electric-500/10 text-electric-400 border border-electric-500/20'
                    : 'text-chrome-400 hover:bg-admin-bg-hover hover:text-white'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 bg-admin-bg-card border border-admin-border rounded-xl">
          {activeTab === 'business' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Precision Engine & Dyno"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    defaultValue="(555) 123-4567"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="info@precision-engine.com"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    defaultValue="https://precision-engine.com"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-chrome-400 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Machine Shop Lane, Los Angeles, CA 90001"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-chrome-400 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="8.25"
                  className="w-32 px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'New service requests', description: 'Get notified when customers submit new requests' },
                  { label: 'Quote status changes', description: 'When quotes are viewed, accepted, or declined' },
                  { label: 'Job updates', description: 'Status changes on active jobs' },
                  { label: 'Payment received', description: 'When payments are processed' },
                  { label: 'Low inventory alerts', description: 'When stock falls below reorder point' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-admin-border last:border-0">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-chrome-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-admin-bg rounded-full peer peer-checked:bg-electric-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-chrome-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Email Configuration</h2>
              <p className="text-chrome-400">Configure SMTP settings for sending emails.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    placeholder="587"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Payment Settings</h2>
              <p className="text-chrome-400">Configure payment processing and terms.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">Default Payment Terms</label>
                  <select className="w-full max-w-xs px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500">
                    <option value="due_on_receipt">Due on Receipt</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-400 mb-2">Stripe API Key</label>
                  <input
                    type="password"
                    placeholder="sk_live_..."
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Document Templates</h2>
              <p className="text-chrome-400">Configure default terms and conditions for quotes and invoices.</p>
              <div>
                <label className="block text-sm font-medium text-chrome-400 mb-2">Quote Terms & Conditions</label>
                <textarea
                  rows={5}
                  defaultValue="Quote valid for 30 days. 50% deposit required to begin work. Prices subject to change based on actual parts and labor required."
                  className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-chrome-400 mb-2">Invoice Terms</label>
                <textarea
                  rows={5}
                  defaultValue="Payment due within terms specified. A late fee of 1.5% per month will be applied to overdue balances."
                  className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Branding</h2>
              <p className="text-chrome-400">Customize the appearance of your documents and customer portal.</p>
              <div>
                <label className="block text-sm font-medium text-chrome-400 mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-admin-bg border border-admin-border rounded-lg flex items-center justify-center">
                    <span className="text-chrome-500 text-xs text-center">Upload Logo</span>
                  </div>
                  <button className="px-4 py-2 bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors">
                    Choose File
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-chrome-400 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue="#00a8ff"
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    defaultValue="#00a8ff"
                    className="w-32 px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-white focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
