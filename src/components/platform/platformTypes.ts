export type PlatformViewId =
  // Identity & User
  | 'profile'
  | 'account-settings'
  | 'notifications'
  // Organization & Team
  | 'organization'
  | 'team-management'
  | 'roles-permissions'
  // Billing & Metering
  | 'billing'
  | 'subscription'
  | 'usage-quotas'
  // Developer & Infrastructure
  | 'api-keys'
  | 'integrations'
  | 'domains'
  | 'deployments'
  | 'database-studio'
  | 'storage'
  // Security & Audit
  | 'security-center'
  | 'activity-logs'
  | 'audit-logs'
  // Ecosystem & Support
  | 'marketplace'
  | 'templates'
  | 'documentation'
  | 'learning-center'
  | 'help-center'
  | 'support'
  | 'contact'
  | 'feedback'
  | 'changelog'
  | 'blog'
  | 'status-page'
  // Administration & System
  | 'admin-login'
  | 'admin-dashboard'
  | 'super-admin'
  | 'system-settings';

export interface PlatformCategory {
  id: string;
  title: string;
  iconName: string;
  items: {
    id: PlatformViewId;
    label: string;
    description: string;
    badge?: string;
  }[];
}
