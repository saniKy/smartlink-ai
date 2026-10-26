/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, Server, Link as LinkIcon, BarChart3, BookOpen, ShieldCheck, CheckCircle2, Database, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isBackendHealthy: boolean | null;
  currentUser: string;
  onSwitchUser: (user: string, token: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  isBackendHealthy,
  currentUser,
  onSwitchUser,
}: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'System Overview', icon: Activity, phase: 'Phase 1' },
    { id: 'links', label: 'Short URLs', icon: LinkIcon, phase: 'Phase 2' },
    { id: 'schema', label: 'PostgreSQL Schema', icon: Database, phase: 'Phase 2' },
    { id: 'api', label: 'API & Health', icon: Server, phase: 'Phase 1' },
    { id: 'analytics', label: 'Click Analytics', icon: BarChart3, phase: 'Phase 3' },
    { id: 'docs', label: 'Documentation', icon: BookOpen, phase: 'Setup' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 md:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-20 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Area */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-white block">
                  SmartLink AI
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Supabase Auth & Links
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.phase}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Demo User Switcher */}
          <div className="mx-3 mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-2">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auth Session Simulator</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSwitchUser('demo.engineer@smartlink.ai', 'demo-token-user-1')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors ${
                  currentUser.includes('engineer')
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                demo.engineer (User 1)
              </button>
              <button
                onClick={() => onSwitchUser('collaborator@smartlink.ai', 'demo-token-user-2')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors ${
                  currentUser.includes('collaborator')
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                collaborator (User 2)
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 leading-tight">
              Switching tokens verifies RLS and backend ownership isolation.
            </div>
          </div>
        </div>

        {/* Server Status Footer */}
        <div className="p-4 m-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-white text-xs">Supabase Auth Active</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tokens:</span>
              <span className="font-mono text-emerald-400">Backend Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">RLS:</span>
              <span className="font-mono text-slate-200">Enforced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Port:</span>
              <span className="font-mono text-slate-200">3000 (Express)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-700 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Phase 2 Implemented</span>
          </div>
        </div>
      </aside>
    </>
  );
}
