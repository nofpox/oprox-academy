import React, { useState } from 'react';
import {
  Building,
  Users,
  Shield,
  UserPlus,
  Mail,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Crown,
  Key,
  Globe,
  Lock,
  Save,
  Check
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface OrganizationViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const OrganizationAndTeamViews: React.FC<OrganizationViewsProps> = ({ viewId, theme = 'dark' }) => {
  // Team Management State
  const [teamMembers, setTeamMembers] = useState([
    { id: 'm1', name: 'Alex Morgan', email: 'alex@oprox.io', role: 'Super Admin', status: 'Active', seats: 'Unlimited' },
    { id: 'm2', name: 'Sarah Connor', email: 'sarah.c@oprox.io', role: 'Lead Designer', status: 'Active', seats: '1 Seat' },
    { id: 'm3', name: 'David Vance', email: 'david.v@oprox.io', role: 'Backend Engineer', status: 'Active', seats: '1 Seat' },
    { id: 'm4', name: 'Elena Rostova', email: 'elena@oprox.io', role: 'PropTech Director', status: 'Invited', seats: 'Pending' }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setTeamMembers((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'Invited',
        seats: '1 Seat'
      }
    ]);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  if (viewId === 'organization') {
    return (
      <div className="space-y-6 select-none">
        {/* Organization Header Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
              OP
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>OPROX Enterprise Global Inc.</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  SOC2 Certified Tenant
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Tenant ID: <strong className="text-slate-200">org_oprox_global_main</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
              SSO Enforced (Okta SAML 2.0)
            </span>
          </div>
        </div>

        {/* Organization Settings */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-5 h-5 text-emerald-400" />
            <span>Organization Profile & Custom Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Company Legal Name</label>
              <input
                type="text"
                defaultValue="OPROX Enterprise Global Inc."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Custom Workspace Domain</label>
              <input
                type="text"
                defaultValue="app.oprox.io"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Primary Billing Contact</label>
              <input
                type="email"
                defaultValue="finance@oprox.io"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Compliance Standard</label>
              <input
                type="text"
                disabled
                defaultValue="SOC2 Type II + GDPR Compliant"
                className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'team-management') {
    return (
      <div className="space-y-6 select-none">
        {/* Header & Invite Action */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Team Member Directory & Seat Allocations</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Manage enterprise seats, access roles, and pending email invitations.
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Member Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-bold">User Name & Email</th>
                <th className="pb-3 font-bold">Assigned Role</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold">Seat Quota</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {teamMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{m.name}</span>
                      {m.role === 'Super Admin' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">{m.email}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-bold text-indigo-300">
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{m.seats}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setTeamMembers((prev) => prev.filter((p) => p.id !== m.id))}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 w-full max-w-md space-y-4 shadow-2xl">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Invite New Team Member</span>
              </h3>

              <form onSubmit={handleSendInvite} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@oprox.io"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Select Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewId === 'roles-permissions') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Role-Based Access Control (RBAC) Policy Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define permissions for API keys, solution deployments, and administrative controls.
            </p>
          </div>

          <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Role</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            {
              role: 'Super Admin',
              desc: 'Full unrestricted access to organization, billing, and API tokens.',
              scopes: ['all:read', 'all:write', 'billing:admin', 'keys:delete', 'deploy:production']
            },
            {
              role: 'Lead Developer',
              desc: 'Can deploy solution studios, manage database schemas, and create test keys.',
              scopes: ['solution:deploy', 'db:migrate', 'keys:create', 'logs:view']
            },
            {
              role: 'Read-Only Viewer',
              desc: 'Read-only access to solution telemetry cards and usage reports.',
              scopes: ['telemetry:read', 'logs:view', 'solutions:view']
            }
          ].map((r, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-emerald-400">{r.role}</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800 font-bold">
                  {r.scopes.length} Scopes
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{r.desc}</p>
              <div className="flex flex-wrap gap-1 pt-2">
                {r.scopes.map((sc, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-indigo-300 border border-slate-800">
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
