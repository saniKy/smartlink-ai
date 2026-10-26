/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { HealthResponse } from '@shared/types/api.ts';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Terminal, Layers } from 'lucide-react';

interface HealthStatusCardProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function HealthStatusCard({
  health,
  loading,
  error,
  onRefresh,
}: HealthStatusCardProps) {
  const [showJson, setShowJson] = useState(false);

  const formatUptime = (seconds?: number) => {
    if (seconds === undefined) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Express API Health & Diagnostics
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Route: <code className="font-mono text-slate-700 font-semibold">GET /api/health</code></span>
            <span aria-hidden="true">·</span>
            <span>Business Logic Owner: Node.js Express</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showJson ? 'Hide JSON' : 'Inspect JSON'}</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Backend Unreachable</div>
              <div className="text-xs text-rose-700 mt-1">{error}</div>
              <div className="text-xs text-rose-600 mt-2">
                Make sure the Express server is running with <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">npm run dev</code>.
              </div>
            </div>
          </div>
        ) : loading && !health ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Connecting to Express API at <code className="font-mono">/api/health</code>...
          </div>
        ) : health ? (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Overall Status</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold capitalize text-slate-900">
                    {health.status}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  HTTP 200 via Express Router
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Service Identifier</div>
                <div className="mt-1.5 text-sm font-semibold font-mono text-slate-900">
                  {health.service}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Build: v{health.version}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Server Uptime</div>
                <div className="mt-1.5 text-sm font-semibold font-mono text-slate-900 tabular-nums">
                  {formatUptime(health.uptimeSeconds)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
                  {health.uptimeSeconds} raw seconds
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Node Environment</div>
                <div className="mt-1.5 text-sm font-semibold font-mono text-slate-900 capitalize">
                  {health.environment}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Strict Zod env validated
                </div>
              </div>
            </div>

            {/* Subsystem Health Breakdown */}
            <div>
              <h3 className="text-xs font-semibold text-slate-700 tracking-wider uppercase mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Subsystem Integrity Checks</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Express API Layer */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Express Router & Middleware</div>
                    <div className="text-[11px] text-slate-500">Owns URL shortening business logic</div>
                  </div>
                  <span className="text-xs font-mono font-medium text-emerald-700">OK</span>
                </div>

                {/* Database Layer */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Supabase PostgreSQL</div>
                    <div className="text-[11px] text-slate-500">
                      {health.checks.database === 'connected' ? 'Connected via backend' : 'Config pending in .env'}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-amber-700">
                    {health.checks.database}
                  </span>
                </div>

                {/* Auth Verification Layer */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Backend JWT Verification</div>
                    <div className="text-[11px] text-slate-500">
                      {health.checks.auth === 'ready' ? 'Keys ready for tokens' : 'Keys pending in .env'}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-amber-700">
                    {health.checks.auth}
                  </span>
                </div>
              </div>
            </div>

            {/* JSON Response Inspector */}
            {showJson && (
              <div className="mt-4 p-4 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
                <div className="text-[11px] text-slate-400 mb-2">// Raw Response payload from GET /api/health</div>
                <pre>{JSON.stringify(health, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
