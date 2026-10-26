/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/layout/TopBar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { HealthStatusCard } from './components/dashboard/HealthStatusCard.tsx';
import { ArchitectureOverview } from './components/dashboard/ArchitectureOverview.tsx';
import { LinksManager } from './components/dashboard/LinksManager.tsx';
import { SchemaMigrationView } from './components/dashboard/SchemaMigrationView.tsx';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard.tsx';
import { DocumentationView } from './components/dashboard/DocumentationView.tsx';
import { apiClient } from './api/client.ts';
import type { HealthResponse } from '@shared/types/api.ts';
import { ChevronRight, Server, ShieldCheck, Database } from 'lucide-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('links'); // Default to Links for Phase 2!
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState('demo.engineer@smartlink.ai');

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await apiClient.checkHealth();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reach Express API';
      setHealthError(message);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleSwitchUser = (email: string, token: string) => {
    setCurrentUser(email);
    apiClient.setAuthToken(token);
  };

  const breadcrumbs: Record<string, string> = {
    overview: 'System Overview & Diagnostics',
    links: 'URL Shortener & Link Management',
    schema: 'PostgreSQL Schema & RLS Policies',
    api: 'Express API Health & Contracts',
    analytics: 'Click Analytics (Phase 3)',
    docs: 'Setup & Migration Guide',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isBackendHealthy={health ? health.status === 'healthy' : null}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onRefreshHealth={fetchHealth}
          isRefreshing={loadingHealth}
        />

        {/* Breadcrumb Trail & Page Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>SmartLink AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium">{breadcrumbs[activeTab] || 'Workspace'}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'links' && 'Short URLs Management & Token Ownership'}
                {activeTab === 'schema' && 'Supabase PostgreSQL Schema & Security Policies'}
                {activeTab === 'overview' && 'System Architecture & Health Inspector'}
                {activeTab === 'api' && 'Express Health Endpoint & API Contracts'}
                {activeTab === 'analytics' && 'Click Analytics Telemetry (Phase 3)'}
                {activeTab === 'docs' && 'Setup, Scripts & Execution Guide'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-stack URL shortener with click analytics · Express API logic ownership
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session: <strong className="font-mono">{currentUser}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Views Content */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'links' && (
            <LinksManager currentUser={currentUser} />
          )}

          {activeTab === 'schema' && (
            <SchemaMigrationView />
          )}

          {activeTab === 'overview' && (
            <>
              <HealthStatusCard
                health={health}
                loading={loadingHealth}
                error={healthError}
                onRefresh={fetchHealth}
              />
              <ArchitectureOverview />
            </>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <HealthStatusCard
                health={health}
                loading={loadingHealth}
                error={healthError}
                onRefresh={fetchHealth}
              />
              <div className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Protected API Endpoints Specification
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span><strong className="text-blue-600">GET</strong> /api/links</span>
                    <span className="text-slate-500">Requires Bearer JWT · Returns user's links</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span><strong className="text-emerald-600">POST</strong> /api/links</span>
                    <span className="text-slate-500">Requires Bearer JWT · Creates short URL</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span><strong className="text-rose-600">DELETE</strong> /api/links/:id</span>
                    <span className="text-slate-500">Requires Bearer JWT · Enforces link ownership</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span><strong className="text-purple-600">GET</strong> /s/:code</span>
                    <span className="text-slate-500">Public · Records click & redirects with 302</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard currentUser={currentUser} />
          )}

          {activeTab === 'docs' && (
            <DocumentationView />
          )}
        </main>
      </div>
    </div>
  );
}
