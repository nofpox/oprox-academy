import React, { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Building,
  Users,
  Shield,
  CreditCard,
  Zap,
  TrendingUp,
  Key,
  Layers,
  Globe,
  Cloud,
  Database,
  HardDrive,
  ShieldCheck,
  Activity,
  FileCheck,
  ShoppingBag,
  Sparkles,
  BookOpen,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  ThumbsUp,
  FileText,
  Radio,
  Sliders,
  Search,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { PlatformViewId, PlatformCategory } from './platformTypes';
import { UserAndIdentityViews } from './UserAndIdentityViews';
import { OrganizationAndTeamViews } from './OrganizationAndTeamViews';
import { BillingAndUsageViews } from './BillingAndUsageViews';
import { DeveloperAndInfrastructureViews } from './DeveloperAndInfrastructureViews';
import { SecurityAndAuditViews } from './SecurityAndAuditViews';
import { EcosystemAndSupportViews } from './EcosystemAndSupportViews';
import { AdminAndSystemViews } from './AdminAndSystemViews';

interface PlatformHubProps {
  theme?: 'dark' | 'light';
}

export const PLATFORM_CATEGORIES: PlatformCategory[] = [
  {
    id: 'cat-identity',
    title: 'Identity & User',
    iconName: 'User',
    items: [
      { id: 'profile', label: 'Profile', description: 'Personal details, avatar & timezone' },
      { id: 'account-settings', label: 'Account Settings', description: 'Password, 2FA security & auth' },
      { id: 'notifications', label: 'Notifications', description: 'In-app, email & Slack webhooks' }
    ]
  },
  {
    id: 'cat-org',
    title: 'Organization & Team',
    iconName: 'Building',
    items: [
      { id: 'organization', label: 'Organization', description: 'Company profile, domain & branding' },
      { id: 'team-management', label: 'Team Management', description: 'Member directory & invitations' },
      { id: 'roles-permissions', label: 'Roles & Permissions', description: 'RBAC security matrix' }
    ]
  },
  {
    id: 'cat-billing',
    title: 'Billing & Metering',
    iconName: 'CreditCard',
    items: [
      { id: 'billing', label: 'Billing', description: 'Payment methods & PDF invoices' },
      { id: 'subscription', label: 'Subscription', description: 'Plan tiers & annual billing' },
      { id: 'usage-quotas', label: 'Usage & Quotas', description: 'Token, storage & seat gauges' }
    ]
  },
  {
    id: 'cat-dev',
    title: 'Developer & Infrastructure',
    iconName: 'Key',
    items: [
      { id: 'api-keys', label: 'API Keys', description: 'Secret API tokens & key rotation' },
      { id: 'integrations', label: 'Integrations', description: 'GitHub, Stripe & AWS connectors' },
      { id: 'domains', label: 'Domains', description: 'Custom DNS & Let\'s Encrypt SSL' },
      { id: 'deployments', label: 'Deployments', description: 'Cloud Run builds & container logs' },
      { id: 'database-studio', label: 'Database Studio', description: 'Drizzle PostgreSQL schema ERD' },
      { id: 'storage', label: 'Storage', description: 'Media buckets & CDN cache' }
    ]
  },
  {
    id: 'cat-security',
    title: 'Security & Audit',
    iconName: 'ShieldCheck',
    items: [
      { id: 'security-center', label: 'Security Center', description: 'SOC2 health score & IP whitelist' },
      { id: 'activity-logs', label: 'Activity Logs', description: 'Real-time telemetry stream' },
      { id: 'audit-logs', label: 'Audit Logs', description: 'Immutable admin audit history' }
    ]
  },
  {
    id: 'cat-ecosystem',
    title: 'Ecosystem & Resources',
    iconName: 'ShoppingBag',
    items: [
      { id: 'marketplace', label: 'Marketplace', description: 'Extension modules & plugins' },
      { id: 'templates', label: 'Templates', description: 'Boilerplate architectures' },
      { id: 'documentation', label: 'Documentation', description: 'REST API & SDK references' },
      { id: 'learning-center', label: 'Learning Center', description: 'Video academy & certifications' },
      { id: 'help-center', label: 'Help Center', description: 'FAQ & troubleshooting' },
      { id: 'support', label: 'Support', description: '15-min SLA support portal' },
      { id: 'contact', label: 'Contact', description: 'Enterprise sales & contact' },
      { id: 'feedback', label: 'Feedback', description: 'Product roadmap & feature votes' },
      { id: 'changelog', label: 'Changelog', description: 'Platform releases & patch notes' },
      { id: 'blog', label: 'Blog', description: 'Engineering deep dives' },
      { id: 'status-page', label: 'Status Page', description: 'Live operational status' }
    ]
  },
  {
    id: 'cat-admin',
    title: 'Administration & System',
    iconName: 'Lock',
    items: [
      { id: 'admin-login', label: 'Admin Login', description: 'Super admin security auth' },
      { id: 'admin-dashboard', label: 'Admin Dashboard', description: 'Global MRR & platform telemetry' },
      { id: 'super-admin', label: 'Super Admin', description: 'Multi-tenant feature flags' },
      { id: 'system-settings', label: 'System Settings', description: 'Rate limits & maintenance' }
    ]
  }
];

export const PlatformHub: React.FC<PlatformHubProps> = ({ theme = 'dark' }) => {
  const [activeViewId, setActiveViewId] = useState<PlatformViewId>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = theme === 'dark';

  // Find active item info
  let activeItemLabel = 'Platform Page';
  let activeCategoryTitle = 'Platform Hub';

  for (const cat of PLATFORM_CATEGORIES) {
    const found = cat.items.find((item) => item.id === activeViewId);
    if (found) {
      activeItemLabel = found.label;
      activeCategoryTitle = cat.title;
      break;
    }
  }

  // Filter items by search
  const filteredCategories = PLATFORM_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 select-none ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header Bar for Platform Suite */}
      <div className={`border-b sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`lg:hidden p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>OPROX Suite</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{activeCategoryTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
              {activeItemLabel}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all 33 pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Main Body with Sidebar + View Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6 relative">
        {/* Sidebar Navigation */}
        <aside
          className={`w-64 shrink-0 border rounded-2xl p-4 space-y-6 overflow-y-auto max-h-[85vh] text-xs font-mono fixed lg:static inset-y-20 left-4 z-40 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-md'
          } ${
            sidebarOpen ? 'block shadow-2xl' : 'hidden lg:block'
          }`}
        >
          <div className={`text-[10px] uppercase font-bold tracking-wider pb-2 border-b ${
            isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
          }`}>
            Platform Pages Directory ({PLATFORM_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)})
          </div>

          <div className="space-y-4">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider block px-2 ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  {cat.title}
                </span>

                <div className="space-y-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveViewId(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                        activeViewId === item.id
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : isDark
                          ? 'text-slate-300 hover:text-white hover:bg-slate-950/60'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeViewId === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* View Component Container */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Identity & User Views */}
          {(activeViewId === 'profile' || activeViewId === 'account-settings' || activeViewId === 'notifications') && (
            <UserAndIdentityViews viewId={activeViewId} theme={theme} />
          )}

          {/* Organization & Team Views */}
          {(activeViewId === 'organization' || activeViewId === 'team-management' || activeViewId === 'roles-permissions') && (
            <OrganizationAndTeamViews viewId={activeViewId} theme={theme} />
          )}

          {/* Billing & Usage Views */}
          {(activeViewId === 'billing' || activeViewId === 'subscription' || activeViewId === 'usage-quotas') && (
            <BillingAndUsageViews viewId={activeViewId} theme={theme} />
          )}

          {/* Developer & Infrastructure Views */}
          {(activeViewId === 'api-keys' ||
            activeViewId === 'integrations' ||
            activeViewId === 'domains' ||
            activeViewId === 'deployments' ||
            activeViewId === 'database-studio' ||
            activeViewId === 'storage') && (
            <DeveloperAndInfrastructureViews viewId={activeViewId} theme={theme} />
          )}

          {/* Security & Audit Views */}
          {(activeViewId === 'security-center' || activeViewId === 'activity-logs' || activeViewId === 'audit-logs') && (
            <SecurityAndAuditViews viewId={activeViewId} theme={theme} />
          )}

          {/* Ecosystem & Support Views */}
          {(activeViewId === 'marketplace' ||
            activeViewId === 'templates' ||
            activeViewId === 'documentation' ||
            activeViewId === 'learning-center' ||
            activeViewId === 'help-center' ||
            activeViewId === 'support' ||
            activeViewId === 'contact' ||
            activeViewId === 'feedback' ||
            activeViewId === 'changelog' ||
            activeViewId === 'blog' ||
            activeViewId === 'status-page') && (
            <EcosystemAndSupportViews viewId={activeViewId} theme={theme} />
          )}

          {/* Admin & System Views */}
          {(activeViewId === 'admin-login' ||
            activeViewId === 'admin-dashboard' ||
            activeViewId === 'super-admin' ||
            activeViewId === 'system-settings') && (
            <AdminAndSystemViews viewId={activeViewId} theme={theme} />
          )}
        </main>
      </div>
    </div>
  );
};
