import React, { useState } from 'react';
import { X, Sliders, Moon, Sun, Cpu, ShieldCheck, Key, Save, Check } from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'preferences' | 'ai-swarm' | 'security'>('preferences');
  
  // Settings State
  const [autoSave, setAutoSave] = useState(true);
  const [saveInterval, setSaveInterval] = useState('1000');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [fontSize, setFontSize] = useState('14');
  const [compactMode, setCompactMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('oprox_settings', JSON.stringify({
      autoSave,
      saveInterval,
      selectedModel,
      fontSize,
      compactMode
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Platform Settings & Governance</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure UI preferences, AI model engines, and security credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className={`px-6 pt-3 border-b flex gap-4 ${isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-100/50'}`}>
          {[
            { id: 'preferences', label: 'UI & Editor' },
            { id: 'ai-swarm', label: 'AI Swarm Engine' },
            { id: 'security', label: 'Security & Access' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Platform preferences updated successfully!</span>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-950/40 border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-200">Theme Color Scheme</h4>
                  <p className="text-[11px] text-slate-400">Toggle between Dark and Light mode canvas</p>
                </div>
                <button
                  onClick={onToggleTheme}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-2"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-950/40 border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-200">Auto-Save VFS Files</h4>
                  <p className="text-[11px] text-slate-400">Automatically save modified code files in background</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Editor Font Size (px)</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="12">12px - Dense</option>
                    <option value="14">14px - Standard</option>
                    <option value="16">16px - Large</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Auto-Save Interval</label>
                  <select
                    value={saveInterval}
                    onChange={(e) => setSaveInterval(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="500">500 ms (Instant)</option>
                    <option value="1000">1,000 ms (Normal)</option>
                    <option value="3000">3,000 ms (Delayed)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-swarm' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Primary AI Foundation Model</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Sub-second response time, optimal for code synthesis' },
                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Complex reasoning, multi-file refactoring' },
                    { id: 'gemini-3.0-pro', name: 'Gemini 3.0 Pro', desc: 'Enterprise deep reasoning & architecture AST' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedModel === m.id
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <h5 className="font-bold text-xs text-white">{m.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-950/40 border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">AI Wallet CostGuard Reserve</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">$250.00 Credit</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enforces authoritative database pre-checks before executing AI swarm prompts.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border bg-slate-950/40 border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Active Session Role</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  User ID: <span className="text-emerald-400">usr_admin01</span> (Enterprise Admin)
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-950/40 border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>API Secrets & Encryption</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  All keys are stored using AES-256-GCM authenticated encryption at rest in PostgreSQL.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Close
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
