import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Mail,
  Key,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  Save,
  Lock,
  Camera,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface UserViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const UserAndIdentityViews: React.FC<UserViewsProps> = ({ viewId, theme = 'dark' }) => {
  const [profileName, setProfileName] = useState('Alex Morgan');
  const [profileEmail, setProfileEmail] = useState('alex.morgan@oprox.io');
  const [profileBio, setProfileBio] = useState('Principal AI Architect & Infrastructure Engineer at OPROX Labs.');
  const [profileRole, setProfileRole] = useState('Enterprise Super Admin');
  const [profileTimezone, setProfileTimezone] = useState('UTC-08:00 (Pacific Time)');
  const [savedStatus, setSavedStatus] = useState(false);

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [securityPush, setSecurityPush] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  if (viewId === 'profile') {
    return (
      <div className="space-y-6 select-none">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                AM
              </div>
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>{profileName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Verified Executive
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profileRole} • {profileEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              User ID: <strong className="text-emerald-400">usr_982410a</strong>
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-emerald-400" />
            <span>Personal Profile Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Executive Bio</label>
              <textarea
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Preferred Timezone</label>
              <select
                value={profileTimezone}
                onChange={(e) => setProfileTimezone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option>UTC-08:00 (Pacific Time)</option>
                <option>UTC-05:00 (Eastern Time)</option>
                <option>UTC+00:00 (London, GMT)</option>
                <option>UTC+03:00 (Riyadh, AST)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Assigned System Role</label>
              <input
                type="text"
                disabled
                value={profileRole}
                className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-md"
            >
              {savedStatus ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedStatus ? 'Changes Saved!' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (viewId === 'account-settings') {
    return (
      <div className="space-y-6 select-none">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            <span>Account Security & Password Authentication</span>
          </h2>

          <div className="space-y-4 font-mono text-xs max-w-xl">
            <div>
              <label className="text-slate-400 block mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">New Password</label>
              <input
                type="password"
                placeholder="At least 12 characters with symbols"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Multi-Factor Authentication */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Two-Factor Authentication (2FA)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Protect your enterprise account using hardware security keys or authenticator apps.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Enforced by Admin
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-white font-bold block">TOTP Authenticator App (Google Authenticator / 1Password)</span>
              <span className="text-slate-400">Configured on July 14, 2026</span>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-bold cursor-pointer">
              Reconfigure 2FA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'notifications') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <span>Notification Preferences & Webhook Channels</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure how and when OPROX notifies you regarding deployment alerts, security events, and AI swarm updates.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-white font-bold block">Critical Security & Login Alerts</span>
              <span className="text-slate-400">Immediate email and push notifications on unexpected IP sign-ins.</span>
            </div>
            <button
              onClick={() => setSecurityPush(!securityPush)}
              className="text-emerald-400 cursor-pointer"
            >
              {securityPush ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-white font-bold block">Cloud Run & Deployment Pipeline Events</span>
              <span className="text-slate-400">Notifications when automated builds complete or fail.</span>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className="text-emerald-400 cursor-pointer"
            >
              {emailAlerts ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-white font-bold block">Slack / Discord Webhook Notifications</span>
              <span className="text-slate-400">Send live AI swarm code generation logs to shared team channels.</span>
            </div>
            <button
              onClick={() => setSlackAlerts(!slackAlerts)}
              className="text-emerald-400 cursor-pointer"
            >
              {slackAlerts ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-white font-bold block">Weekly Executive Usage Summary</span>
              <span className="text-slate-400">A weekly PDF summary of token consumption and cost optimization.</span>
            </div>
            <button
              onClick={() => setWeeklyDigest(!weeklyDigest)}
              className="text-emerald-400 cursor-pointer"
            >
              {weeklyDigest ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
