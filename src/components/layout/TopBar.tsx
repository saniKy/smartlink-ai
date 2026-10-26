/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface TopBarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onRefreshHealth: () => void;
  isRefreshing: boolean;
}

export function TopBar({
  onToggleSidebar,
  activeTab,
  onSelectTab,
  onRefreshHealth,
  isRefreshing,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark + mobile menu toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          SmartLink AI
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('overview')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'overview' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'api' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          API & Contracts
        </button>
        <button
          onClick={() => onSelectTab('links')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'links' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Links Preview
        </button>
        <button
          onClick={() => onSelectTab('docs')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'docs' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Documentation
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRefreshHealth}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          {isRefreshing ? 'Checking API...' : 'Ping API Health'}
        </button>
      </div>
    </header>
  );
}
