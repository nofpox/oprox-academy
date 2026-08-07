import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Rocket,
  Settings,
  Sparkles,
  Shield,
  CreditCard,
  Building2,
  Film,
  Key,
  Bot
} from 'lucide-react';
import { SolutionsHome } from './SolutionsHome';
import { SolutionsMarketplace } from './SolutionsMarketplace';
import { LaunchCenter } from './LaunchCenter';
import { SolutionDashboard } from './SolutionDashboard';
import { SolutionsSettingsBilling } from './SolutionsSettingsBilling';
import {
  MOCK_SOLUTIONS,
  MOCK_ACTIVITY_LOGS,
  MOCK_PERMISSIONS,
  MOCK_BILLING_SUMMARY
} from '../../data/solutionsData';
import { IndustrySolution } from '../../types';

interface SolutionsPlatformProps {
  theme?: 'dark' | 'light';
}

export type SolutionTab = 'home' | 'marketplace' | 'launch-center' | 'active-solution' | 'settings-billing';

export const SolutionsPlatform: React.FC<SolutionsPlatformProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<SolutionTab>('home');
  const [solutions, setSolutions] = useState<IndustrySolution[]>(MOCK_SOLUTIONS);
  const [activeSolutionId, setActiveSolutionId] = useState<string>('sol-media-studio');

  const handleToggleInstall = (solutionId: string) => {
    setSolutions((prev) =>
      prev.map((s) =>
        s.id === solutionId
          ? {
              ...s,
              isInstalled: !s.isInstalled,
              status: !s.isInstalled ? 'Active' : 'Available'
            }
          : s
      )
    );
  };

  const handleNavigateTab = (tab: SolutionTab, solutionId?: string) => {
    setActiveTab(tab);
    if (solutionId) {
      setActiveSolutionId(solutionId);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation Ribbon for Solutions Platform */}
      <div className={`border-b sticky top-0 z-30 backdrop-blur-md transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  OPROX Solutions
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Industry Platform
                </span>
              </div>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Vertical Domain Applications • Autonomous AI Studios
              </p>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className={`flex items-center gap-1.5 p-1 rounded-2xl border text-xs font-mono ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'home', label: 'Home Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
              { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
              { id: 'launch-center', label: 'Launch Center', icon: <Rocket className="w-3.5 h-3.5" /> },
              { id: 'active-solution', label: 'Solution Studio', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'settings-billing', label: 'Settings & Billing', icon: <Settings className="w-3.5 h-3.5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SolutionTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <SolutionsHome
            solutions={solutions}
            activityLogs={MOCK_ACTIVITY_LOGS}
            onNavigateTab={handleNavigateTab}
            onToggleInstall={handleToggleInstall}
            theme={theme}
          />
        )}

        {activeTab === 'marketplace' && (
          <SolutionsMarketplace
            solutions={solutions}
            onToggleInstall={handleToggleInstall}
            onLaunchSolution={(id) => handleNavigateTab('active-solution', id)}
            theme={theme}
          />
        )}

        {activeTab === 'launch-center' && (
          <LaunchCenter
            solutions={solutions}
            onLaunchSolution={(id) => handleNavigateTab('active-solution', id)}
            theme={theme}
          />
        )}

        {activeTab === 'active-solution' && (
          <SolutionDashboard
            solutions={solutions}
            activeSolutionId={activeSolutionId}
            onChangeActiveSolution={setActiveSolutionId}
            activityLogs={MOCK_ACTIVITY_LOGS}
            theme={theme}
          />
        )}

        {activeTab === 'settings-billing' && (
          <SolutionsSettingsBilling
            permissions={MOCK_PERMISSIONS}
            billingSummary={MOCK_BILLING_SUMMARY}
            theme={theme}
          />
        )}
      </main>
    </div>
  );
};
